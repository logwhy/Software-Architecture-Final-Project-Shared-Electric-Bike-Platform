<template>
  <div class="map-container">
    <div id="amap-container"></div>
    <div class="vehicle-list">
      <el-card
          v-for="v in vehicles"
          :key="v.id"
          class="vehicle-card"
          :class="{ active: activeVehicleId === v.id }"
          @click="focusVehicle(v)"
          style="cursor: pointer; transition: all 0.3s;"
      >
        <div class="flex justify-between items-center">
          <div>
            <div class="font-bold">{{ v.code }}</div>
            <div class="text-sm text-gray-500">
              电量: {{ v.battery }}% | {{ statusMap[v.status] }}
            </div>
          </div>
          <el-tag :type="statusTag[v.status]">{{ statusMap[v.status] }}</el-tag>
        </div>
      </el-card>
    </div>
    <el-dialog
        v-model="unlockDialog.visible"
        title="扫码解锁"
        width="320px"
        center
        :close-on-click-modal="false"
    >
      <div class="text-center">
        <div id="qrcode" ref="qrcode"></div>
        <p class="mt-4 text-sm text-gray-600">请用APP扫描二维码解锁</p>
      </div>
      <template #footer>
        <el-button @click="cancelUnlock">取消</el-button>
        <el-button type="primary" @click="simulateScan" :loading="unlocking">
          模拟扫码成功
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import QRCode from 'qrcode.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const vehicles = ref([])
const unlockDialog = ref({
  visible: false,
  vehicle: null
})
const unlocking = ref(false)

let map = null
let markers = []
const activeVehicleId = ref(null)  // 高亮选中车辆

const focusVehicle = (vehicle) => {
  activeVehicleId.value = vehicle.id

  const coords = vehicle.location?.coordinates || vehicle.location
  if (coords && coords.length >= 2) {
    const [lng, lat] = coords.map(Number)
    if (!isNaN(lng) && !isNaN(lat)) {
      map.setZoomAndCenter(18, [lng, lat])
    }
  }

  // 打开扫码解锁弹窗
  unlockDialog.value = { visible: true, vehicle }
  nextTick(() => {
    renderQRCode(vehicle)
  })
}

const renderQRCode = (vehicle) => {
  const qr = document.getElementById('qrcode')
  if (qr) qr.innerHTML = ''  // 清空旧二维码
  new QRCode(qr, {
    text: JSON.stringify({ action: 'unlock', vehicleId: vehicle.id }),
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff'
  })
}

const simulateScan = async () => {
  unlocking.value = true
  try {
    const token = localStorage.getItem('token')
    const vehicleId = unlockDialog.value.vehicle.id

    // 1. 调用后端开始骑行
    const { data } = await axios.post('/api/ride/start', {
      vehicleId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // 2. 关键：保存 ride.id 到 localStorage
    if (data.ride?.id) {
      localStorage.setItem('current_ride', JSON.stringify({
        id: data.ride.id,
        start_time: data.ride.start_time
      }))
    } else {
      throw new Error('后端未返回 ride.id')
    }

    // 3. 成功提示 + 跳转
    ElMessage.success('解锁成功！开始骑行')
    unlockDialog.value.visible = false
    router.push({
      name: 'Riding',
      params: { vehicleId }
    })

  } catch (err) {
    console.error('解锁失败:', err)
    ElMessage.error(err.response?.data?.message || '解锁失败，请重试')
  } finally {
    unlocking.value = false
  }
}

const cancelUnlock = () => {
  unlockDialog.value.visible = false
}

const statusMap = {
  IDLE: '空闲',
  IN_USE: '使用中',
  LOCKED: '锁定',
  MAINTENANCE: '维护中'
}

const statusTag = {
  IDLE: 'success',
  IN_USE: 'warning',
  LOCKED: 'danger',
  MAINTENANCE: 'info'
}

const loadAMap = () => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap)
      return
    }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=439942f223315c82fa3695c7902ad31f&plugin=AMap.ControlBar`
    script.onload = () => resolve(window.AMap)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

const initMap = async () => {
  try {
    const AMap = await loadAMap()
    map = new AMap.Map('amap-container', {
      zoom: 15,
      center: [116.31, 39.91],
      pitch: 45,
      viewMode: '3D'
    })

    // 添加控制栏
    map.addControl(new AMap.ControlBar())

    fetchVehicles()
    setInterval(fetchVehicles, 5000) // 每5秒刷新
  } catch (err) {
    ElMessage.error('地图加载失败')
  }
}

const fetchVehicles = async () => {
  try {
    const token = localStorage.getItem('token')
    const res = await axios.get('/api/vehicles', {
      headers: { Authorization: `Bearer ${token}` }
    })

    vehicles.value = res.data.vehicles || []

    // 清除旧标记
    if (markers.length) map.remove(markers)
    markers = []

    vehicles.value.forEach(v => {
      // 确保 location 是 [lng, lat] 数组
      const coords = v.location?.coordinates || v.location
      if (!coords || coords.length < 2) return

      const [lng, lat] = coords.map(Number)  // 强制转数字
      if (isNaN(lng) || isNaN(lat)) return

      const marker = new window.AMap.Marker({
        position: [lng, lat],
        title: `${v.code} (${v.battery}%)`,
        icon: v.status === 'IN_USE'
            ? 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
            : 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
      })

      // 点击弹窗
      marker.on('click', () => {
        const info = new window.AMap.InfoWindow({
          content: `
            <div style="padding:8px;font-size:14px;">
              <b>${v.code}</b><br>
              电量: ${v.battery}%<br>
              状态: ${statusMap[v.status]}
            </div>
          `
        })
        info.open(map, marker.getPosition())
      })

      markers.push(marker)
    })

    // 批量添加标记
    if (markers.length) {
      map.add(markers)
      // 自动缩放到包含所有标记
      map.setFitView(markers)
    }

  } catch (err) {
    console.error('获取车辆失败:', err)
    if (err.response?.status === 401) {
      ElMessage.error('登录过期')
      localStorage.clear()
      router.push('/login')
    }
  }
}

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) map.destroy()
})
</script>

<style scoped>
.map-container {
  position: relative;
  height: 100vh;
}
#amap-container {
  width: 100%;
  height: 100%;
}
.vehicle-list {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(255,255,255,0.9);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
}
.vehicle-card {
  margin-bottom: 10px;
  border: 1px solid #e4e7ed;
}

.vehicle-card.active {
  border-color: #409eff;
  background-color: #ecf5ff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.3);
}

.vehicle-card:hover {
  border-color: #409eff;
  transform: translateY(-2px);
}
</style>

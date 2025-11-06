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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const vehicles = ref([])
let map = null
let markers = []
const activeVehicleId = ref(null)  // 高亮选中车辆

const focusVehicle = (vehicle) => {
  activeVehicleId.value = vehicle.id

  const coords = vehicle.location?.coordinates || vehicle.location
  if (!coords || coords.length < 2) return

  const [lng, lat] = coords.map(Number)
  if (isNaN(lng) || isNaN(lat)) return

  // 地图平滑移动到车辆位置
  map.setZoomAndCenter(18, [lng, lat])

  // 找到对应标记并打开信息窗
  const marker = markers.find(m => m.getTitle()?.includes(vehicle.code))
  if (marker) {
    map.setCenter(marker.getPosition())
    marker.emit('click')  // 触发点击，打开信息窗
  }
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

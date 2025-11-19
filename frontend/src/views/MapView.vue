<template>
  <div class="map-container">
    <div id="amap-container"></div>

    <!-- 园区选择器 - 独立组件 -->
    <ParkSelector
        @park-change="handleParkChange"
        @parks-loaded="handleParksLoaded"
    />

    <!-- 园区边界 - 纯展示组件 -->
    <ParkBoundary
        v-if="map"
        :parks="allParks"
        :map="map"
    />

    <!-- 车辆列表开关按钮（自行车图标） -->
    <button
        class="vehicle-toggle-btn"
        type="button"
        @click="toggleVehiclePanel"
    >
      <el-icon>
        <Bicycle />
      </el-icon>
    </button>

    <!-- 车辆列表 - 右侧抽屉 -->
    <VehicleList
        :vehicles="vehicles"
        :current-ride="currentRide"
        @vehicle-focus="focusVehicle"
        :class="['vehicle-list-container', { 'is-open': isVehiclePanelOpen }]"
    />


    <!-- 扫码解锁弹窗 -->
    <el-dialog
        v-model="unlockDialog.visible"
        title="扫码解锁"
        width="340px"
        center
        :close-on-click-modal="false"
    >
      <div class="text-center">
        <div id="qrcode" ref="qrcode"></div>
        <p class="mt-3 text-sm text-gray-600">请用APP扫描二维码解锁</p>
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
import ParkSelector from './components/ParkSelector.vue'
import VehicleList from './components/VehicleList.vue'
import ParkBoundary from './components/ParkBoundary.vue'
import { Bicycle } from '@element-plus/icons-vue'

const router = useRouter()
const vehicles = ref([])
const currentRide = ref(null)
const unlockDialog = ref({ visible: false, vehicle: null })
const unlocking = ref(false)
const allParks = ref([]) // 所有园区数据，只用于边界显示
const currentPark = ref(null) // 当前选中园区
const mapInitialized = ref(false)
const isVehiclePanelOpen = ref(false) // 附近车辆抽屉是否打开

let parkPolygons = [] // 单独管理园区边界
let map = null
let markers = []

// 加载高德地图
const loadAMap = () => new Promise((resolve) => {
  if (window.AMap) return resolve(window.AMap)
  const script = document.createElement('script')
  script.src = 'https://webapi.amap.com/maps?v=2.0&key=439942f223315c82fa3695c7902ad31f&plugin=AMap.ControlBar'
  script.onload = () => resolve(window.AMap)
  document.head.appendChild(script)
})

// 初始化地图
const initMap = async () => {
  const AMap = await loadAMap()
  map = new AMap.Map('amap-container', {
    zoom: 15,
    center: [116.31, 39.91],
    pitch: 45,
    viewMode: '3D'
  })

  // 添加指南针控件到左下角
  map.addControl(new AMap.ControlBar({
    position: {
      bottom: '30px',
      left: '10px',
      right: 'auto',
      top: 'auto'
    }
  }))

  mapInitialized.value = true
}

// 处理园区加载完成
const handleParksLoaded = (parks) => {
  allParks.value = parks
  updateParkBoundaries(parks)

  // 只有在地图初始化完成后才自动选择第一个园区
  if (mapInitialized.value && parks.length > 0 && !currentPark.value) {
    handleParkChange({
      parkId: parks[0].id,
      parkData: parks[0]
    })
  }
}

// 添加专门的方法管理园区边界
const updateParkBoundaries = (parks) => {
  // 清除旧边界
  if (parkPolygons.length) {
    map.remove(parkPolygons)
    parkPolygons = []
  }

  parks.forEach(park => {
    if (!park.boundary_coordinates || !Array.isArray(park.boundary_coordinates)) return

    const polygon = new window.AMap.Polygon({
      path: park.boundary_coordinates,
      strokeColor: '#1890ff',
      strokeWeight: 2,
      strokeOpacity: 0.8,
      fillColor: '#1890ff',
      fillOpacity: 0.2,
      zIndex: 50
    })
    polygon.isParkBoundary = true // 标记为园区边界

    parkPolygons.push(polygon)
  })

  if (parkPolygons.length) {
    map.add(parkPolygons)
  }
}

// 处理园区切换
const handleParkChange = ({ parkId, parkData }) => {
  currentPark.value = parkData
  fetchVehicles(parkId)

  // 聚焦到选中的园区 - 添加更严格的地图实例检查
  if (parkData && parkData.center_lng && parkData.center_lat && map && typeof map.setZoomAndCenter === 'function') {
    try {
      map.setZoomAndCenter(16, [parkData.center_lng, parkData.center_lat])
    } catch (error) {
      console.error('地图聚焦失败:', error)
    }
  }
}

// 获取车辆
const fetchVehicles = async (parkId) => {
  if (!parkId) return

  try {
    const token = localStorage.getItem('token')
    const res = await axios.get(`/api/vehicles?parkId=${parkId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    vehicles.value = res.data.vehicles || []
    updateMapMarkers()
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.clear()
      router.push('/login')
    }
  }
}

// 更新地图标记
const updateMapMarkers = () => {
  // 清除旧标记
  if (markers.length) map.remove(markers)
  markers = []

  vehicles.value.forEach(v => {
    const coords = v.location?.coordinates || []
    if (!coords || coords.length < 2) return
    const [lng, lat] = coords.map(Number)
    if (isNaN(lng) || isNaN(lat)) return

    const marker = new window.AMap.Marker({
      position: [lng, lat],
      title: `${v.code} (${v.battery}%)`,
      icon: v.status === 'IN_USE'
          ? 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png'
          : 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
    })

    marker.on('click', () => {
      if (localStorage.getItem('current_ride')) {
        ElMessage.warning('您已有一辆车正在使用中')
        return
      }
      unlockDialog.value = { visible: true, vehicle: v }
      nextTick(() => renderQRCode(v))
    })

    markers.push(marker)
  })

  if (markers.length) {
    map.add(markers)
  }
}

// 聚焦车辆
const focusVehicle = (vehicle) => {
  const coords = vehicle.location?.coordinates || []
  if (coords && coords.length >= 2) {
    const [lng, lat] = coords.map(Number)
    map.setZoomAndCenter(18, [lng, lat])
  }

  if (localStorage.getItem('current_ride')) {
    ElMessage.warning('您已有一辆车正在使用中')
    return
  }

  unlockDialog.value = { visible: true, vehicle }
  nextTick(() => renderQRCode(vehicle))
}

// 生成二维码
const renderQRCode = (vehicle) => {
  const qr = document.getElementById('qrcode')
  if (qr) qr.innerHTML = ''
  new QRCode(qr, {
    text: JSON.stringify({ action: 'unlock', vehicleId: vehicle.id }),
    width: 200,
    height: 200,
    colorDark: '#000000',
    colorLight: '#ffffff'
  })
}

// 模拟扫码
const simulateScan = async () => {
  unlocking.value = true
  try {
    const token = localStorage.getItem('token')
    const vehicleId = unlockDialog.value.vehicle.id
    const { data } = await axios.post('/api/ride/start', { vehicleId }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    const rideInfo = {
      id: data.ride.id,
      start_time: data.ride.start_time,
      vehicle_code: unlockDialog.value.vehicle.code
    }
    localStorage.setItem('current_ride', JSON.stringify(rideInfo))

    ElMessage.success(`解锁成功！开始骑行 ${unlockDialog.value.vehicle.code}`)
    unlockDialog.value.visible = false

    window.dispatchEvent(new Event('ride-started'))
  } catch (err) {
    const msg = err.response?.data?.message || '解锁失败'
    ElMessage.error(msg.includes('正在使用中') ? '您已有一辆车正在使用中' : msg)
  } finally {
    unlocking.value = false
  }
}

const cancelUnlock = () => {
  unlockDialog.value.visible = false
}

const toggleVehiclePanel = () => {
  isVehiclePanelOpen.value = !isVehiclePanelOpen.value
}


onMounted(async () => {
  // PC 端默认展开，手机端默认收起
  if (window.innerWidth > 768) {
    isVehiclePanelOpen.value = true
  }

  await initMap()
  currentRide.value = JSON.parse(localStorage.getItem('current_ride') || 'null')
})


onUnmounted(() => {
  if (map) map.destroy()
})
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0; /* 配合父 flex 布局，避免溢出 */
}

#amap-container {
  width: 100%;
  height: 100%;
}

/* PC 端保持右上角卡片 */
.vehicle-list-container {
  position: absolute;
  top: 20px;
  right: 20px;
}

/* 自行车图标按钮：悬浮在右侧 */
.vehicle-toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

.vehicle-toggle-btn .el-icon {
  font-size: 20px;
}

.vehicle-toggle-btn:active {
  transform: translateY(-50%) scale(0.95);
}

/* ------- 手机端适配 ------- */
@media (max-width: 768px) {
  .vehicle-list-container {
    top: 16px;
    bottom: 16px;
    right: 0;
    width: 70%;
    max-width: 320px;
    background: #ffffff;
    border-radius: 12px 0 0 12px;
    box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);      /* 默认藏在右侧 */
    opacity: 0;
    pointer-events: none;
    transition: transform 0.25s ease, opacity 0.25s ease;
  }

  .vehicle-list-container.is-open {
    transform: translateX(0);         /* 打开时滑入 */
    opacity: 1;
    pointer-events: auto;
  }

  /* 手机端按钮稍微靠下一点，避免挡住系统按钮 */
  .vehicle-toggle-btn {
    top: auto;
    bottom: 80px;
    transform: none;
  }

  .vehicle-toggle-btn:active {
    transform: scale(0.95);
  }
}
</style>

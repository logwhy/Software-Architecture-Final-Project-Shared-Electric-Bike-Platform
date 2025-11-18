<!-- src/views/MaintainerView.vue -->
<template>
  <div class="admin-container">
    <div class="background-wrapper">
      <div class="bg-animation"></div>
    </div>

    <div class="admin-content">
      <el-affix :offset="0">
        <div class="admin-header">
          <div class="header-left">
            <el-icon class="admin-icon"><Setting /></el-icon>
            <span class="header-title">维护后台</span>
          </div>

          <div class="header-right">
            <div class="user-info">
              <el-avatar :size="36" :icon="UserFilled" class="user-avatar" />
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <el-tag
                    :type="roleTag[user.role]"
                    effect="light"
                    size="small"
                >
                  {{ roleMap[user.role] }}
                </el-tag>
              </div>
            </div>

            <el-button type="primary" @click="$router.push('/chat')">
              进入群聊
            </el-button>
            <el-button
                type="danger"
                plain
                @click="logout"
                class="logout-btn"
            >
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-button>
          </div>
        </div>
      </el-affix>

      <div class="main-content">
        <el-card class="content-card" shadow="hover">
          <!-- 统一的卡片头部 -->
          <template #header>
            <div class="card-header">
              <div>
                <div class="card-title">工单处理中心</div>
                <div class="card-subtitle">
                  统一查看并处理投诉任务与车辆维修工单
                </div>
              </div>
            </div>
          </template>

          <!-- 两个列表左右并排 -->
          <div class="lists-wrapper">
            <el-row :gutter="20" class="lists-row">
              <!-- 左侧：投诉列表 -->
              <el-col :xs="24" :md="12">
                <div class="list-block">
                  <div class="list-block-header">
                    <div class="list-block-header-left">
                      <div class="list-block-title-row">
                        <span class="list-block-title">投诉列表</span>
                      </div>
                      <span class="list-block-subtitle">
                        来自用户的投诉任务
                      </span>
                    </div>
                    <el-tag size="small" type="danger">投诉</el-tag>
                  </div>

                  <div class="complaint-tasks-content">
                    <el-table
                        :data="tasks"
                        style="width: 100%"
                        v-loading="loadingTasks"
                    >
                      <el-table-column
                          prop="type"
                          label="投诉类型"
                          width="120"
                      />
                      <el-table-column
                          prop="description"
                          label="投诉内容"
                      />
                      <el-table-column label="投诉位置" width="180">
                        <template #default="scope">
                          <div
                              class="location-clickable"
                              @click="openMapDialog(scope.row.complaintLongitude, scope.row.complaintLatitude)"
                          >
                            经度: {{ scope.row.complaintLongitude }}<br />
                            纬度: {{ scope.row.complaintLatitude }}
                          </div>
                        </template>
                      </el-table-column>

                      <el-table-column
                          prop="status"
                          label="状态"
                          width="100"
                      />
                      <el-table-column label="操作" width="140">
                        <template #default="scope">
                          <el-button
                              v-if="scope.row.status === '待处理'"
                              type="primary"
                              size="small"
                              @click="openCompleteDialog(scope.row)"
                          >
                            提交结果
                          </el-button>
                          <span v-else>已完成</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>

                  <!-- 投诉结果弹窗 -->
                  <el-dialog
                      v-model="completeDialogVisible"
                      title="提交处理结果"
                      width="480px"
                  >
                    <el-form label-width="80px">
                      <el-form-item label="说明">
                        <el-input
                            type="textarea"
                            v-model="resultText"
                            placeholder="请简要描述处理过程和结果"
                            :rows="3"
                        />
                      </el-form-item>

                      <el-form-item label="位置">
                        <div class="location-block">
                          <div v-if="resultLocation" class="location-text">
                            经度: {{ resultLocation.longitude }}，
                            纬度: {{ resultLocation.latitude }}
                          </div>
                          <el-button
                              type="primary"
                              size="small"
                              @click="getCurrentLocation"
                          >
                            获取当前位置
                          </el-button>
                        </div>
                      </el-form-item>

                      <el-form-item label="照片">
                        <div>
                          <input
                              type="file"
                              accept="image/*"
                              @change="onResultPhotoChange"
                          />
                          <div
                              v-if="resultPhotoPreview"
                              class="photo-preview-wrapper"
                          >
                            <img
                                :src="resultPhotoPreview"
                                alt="处理照片预览"
                                class="photo-preview-img"
                            />
                            <el-button
                                type="text"
                                size="small"
                                @click="clearResultPhoto"
                            >
                              删除
                            </el-button>
                          </div>
                        </div>
                      </el-form-item>
                    </el-form>

                    <template #footer>
                      <span class="dialog-footer">
                        <el-button
                            @click="completeDialogVisible = false"
                        >
                          取 消
                        </el-button>
                        <el-button type="primary" @click="submitResult">
                          提 交
                        </el-button>
                      </span>
                    </template>
                  </el-dialog>
                </div>
              </el-col>

              <!-- 右侧：维修列表 -->
              <el-col :xs="24" :md="12">
                <div class="list-block">
                  <div class="list-block-header">
                    <div class="list-block-header-left">
                      <div class="list-block-title-row">
                        <span class="list-block-title">维修列表</span>
                        <el-icon class="section-icon">
                          <Bicycle />
                        </el-icon>
                      </div>
                      <span class="list-block-subtitle">
                        待处理的车辆维修工单
                      </span>
                    </div>
                    <el-tag size="small" type="success">维修</el-tag>
                  </div>

                  <div class="maintenance-vehicles-content">
                    <el-table
                        :data="maintenanceVehicles"
                        style="width: 100%"
                        v-loading="loadingMaintenanceVehicles"
                        empty-text="暂无维修车辆"
                    >
                      <el-table-column
                          prop="code"
                          label="车辆编码"
                          width="120"
                      />
                      <el-table-column label="位置" width="180">
                        <template #default="scope">
                          <div
                              class="location-clickable"
                              @click="openMapDialog(scope.row.longitude, scope.row.latitude)"
                          >
                            经度: {{ scope.row.longitude }}<br />
                            纬度: {{ scope.row.latitude }}
                          </div>
                        </template>
                      </el-table-column>

                      <el-table-column label="操作" width="140">
                        <template #default="scope">
                          <el-button
                              type="primary"
                              size="small"
                              @click="openVehicleDialog(scope.row)"
                          >
                            提交结果
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>

                  <!-- 维修结果弹窗 -->
                  <el-dialog
                      v-model="vehicleDialogVisible"
                      title="提交维修结果"
                      width="480px"
                  >
                    <el-form label-width="80px">
                      <el-form-item label="说明">
                        <el-input
                            type="textarea"
                            v-model="vehicleResultText"
                            placeholder="请简要描述维修过程和结果"
                            :rows="3"
                        />
                      </el-form-item>

                      <el-form-item label="位置">
                        <div class="location-block">
                          <div
                              v-if="vehicleResultLocation"
                              class="location-text"
                          >
                            经度: {{ vehicleResultLocation.longitude }}，
                            纬度: {{ vehicleResultLocation.latitude }}
                          </div>
                          <el-button
                              type="primary"
                              size="small"
                              @click="getCurrentVehicleLocation"
                          >
                            获取当前位置
                          </el-button>
                        </div>
                      </el-form-item>

                      <el-form-item label="照片">
                        <div>
                          <input
                              type="file"
                              accept="image/*"
                              @change="onVehiclePhotoChange"
                          />
                          <div
                              v-if="vehicleResultPhotoPreview"
                              class="photo-preview-wrapper"
                          >
                            <img
                                :src="vehicleResultPhotoPreview"
                                alt="维修照片预览"
                                class="photo-preview-img"
                            />
                            <el-button
                                type="text"
                                size="small"
                                @click="clearVehiclePhoto"
                            >
                              删除
                            </el-button>
                          </div>
                        </div>
                      </el-form-item>
                    </el-form>

                    <template #footer>
                      <span class="dialog-footer">
                        <el-button
                            @click="vehicleDialogVisible = false"
                        >
                          取 消
                        </el-button>
                        <el-button
                            type="primary"
                            @click="submitVehicleResult"
                        >
                          提 交
                        </el-button>
                      </span>
                    </template>
                  </el-dialog>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
        <!-- 地图位置查看弹窗 -->
        <el-dialog
            v-model="mapDialogVisible"
            title="位置查看"
            width="600px"
            destroy-on-close
        >
          <div class="map-wrapper">
            <div id="amap-container" class="map-container"></div>
            <div class="map-coords">
              经度：{{ mapLngLat.lng }}，纬度：{{ mapLngLat.lat }}
            </div>
          </div>
        </el-dialog>

      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { Setting, Bicycle, UserFilled, SwitchButton } from '@element-plus/icons-vue'
import { nextTick, watch } from 'vue'

const router = useRouter()
const user = ref({})

// 投诉任务列表
const tasks = ref([])
const loadingTasks = ref(false)

// 提交投诉结果对话框
const completeDialogVisible = ref(false)
const currentTask = ref(null)
const resultText = ref('')
const resultLocation = ref(null)
const resultPhotoPreview = ref(null)
const resultPhotoFile = ref(null)

// 维修车辆列表
const maintenanceVehicles = ref([])
const loadingMaintenanceVehicles = ref(false)

// 维修结果对话框
const vehicleDialogVisible = ref(false)
const currentVehicle = ref(null)
const vehicleResultText = ref('')
const vehicleResultLocation = ref(null)
const vehicleResultPhotoPreview = ref(null)
const vehicleResultPhotoFile = ref(null)

const roleMap = { OPERATOR: '运营', MAINTAINER: '维护员', PARK_ADMIN: '管理员' }
const roleTag = { OPERATOR: 'warning', MAINTAINER: 'info', PARK_ADMIN: 'danger' }

// 加载当前维护员的投诉任务列表
const loadTasks = async () => {
  if (!user.value.id) return
  loadingTasks.value = true
  try {
    const res = await axios.get('/api/complaint-tasks', {
      params: { maintainerId: user.value.id }
    })
    tasks.value = res.data || []
  } catch (e) {
    ElMessage.error('任务列表获取失败')
  } finally {
    loadingTasks.value = false
  }
}

// 加载需要维修的车辆列表
const loadMaintenanceVehicles = async () => {
  loadingMaintenanceVehicles.value = true
  try {
    const res = await axios.get('/api/maintenance-vehicles')
    maintenanceVehicles.value = res.data || []
  } catch (e) {
    ElMessage.error('维修车辆列表获取失败')
  } finally {
    loadingMaintenanceVehicles.value = false
  }
}

// 打开投诉任务提交结果弹窗
const openCompleteDialog = (task) => {
  currentTask.value = task
  resultText.value = ''
  resultLocation.value = null
  resultPhotoPreview.value = null
  resultPhotoFile.value = null
  completeDialogVisible.value = true
}

// 打开车辆维修提交结果弹窗
const openVehicleDialog = (vehicle) => {
  currentVehicle.value = vehicle
  vehicleResultText.value = ''
  vehicleResultLocation.value = null
  vehicleResultPhotoPreview.value = null
  vehicleResultPhotoFile.value = null
  vehicleDialogVisible.value = true
}

// 获取当前位置（投诉任务）
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    ElMessage.error('当前浏览器不支持定位')
    return
  }
  navigator.geolocation.getCurrentPosition(
      pos => {
        resultLocation.value = {
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }
      },
      () => {
        ElMessage.error('无法获取位置信息，请检查定位权限')
      }
  )
}

// 获取当前位置（车辆维修）
const getCurrentVehicleLocation = () => {
  if (!navigator.geolocation) {
    ElMessage.error('当前浏览器不支持定位')
    return
  }
  navigator.geolocation.getCurrentPosition(
      pos => {
        vehicleResultLocation.value = {
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }
      },
      () => {
        ElMessage.error('无法获取位置信息，请检查定位权限')
      }
  )
}

// 选择投诉处理照片
const onResultPhotoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    resultPhotoFile.value = file
    resultPhotoPreview.value = URL.createObjectURL(file)
  }
}

const clearResultPhoto = () => {
  resultPhotoFile.value = null
  resultPhotoPreview.value = null
}

// 选择车辆维修照片
const onVehiclePhotoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    vehicleResultPhotoFile.value = file
    vehicleResultPhotoPreview.value = URL.createObjectURL(file)
  }
}

const clearVehiclePhoto = () => {
  vehicleResultPhotoFile.value = null
  vehicleResultPhotoPreview.value = null
}

// 提交投诉处理结果到后端
const submitResult = async () => {
  if (!currentTask.value) return
  if (!resultText.value || !resultLocation.value) {
    ElMessage.warning('请填写处理说明并获取位置信息')
    return
  }
  try {
    const formData = new FormData()
    formData.append('resultText', resultText.value)
    formData.append('latitude', resultLocation.value.latitude)
    formData.append('longitude', resultLocation.value.longitude)
    formData.append('maintainerId', String(user.value.id))
    formData.append('maintainerName', user.value.name || '')
    if (resultPhotoFile.value) {
      formData.append('photo', resultPhotoFile.value)
    }

    await axios.post(`/api/complaint-tasks/${currentTask.value.id}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    ElMessage.success('任务已完成')
    completeDialogVisible.value = false

    const target = tasks.value.find(t => t.id === currentTask.value.id)
    if (target) {
      target.status = '已完成'
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  }
}

// 提交车辆维修结果到后端
const submitVehicleResult = async () => {
  if (!currentVehicle.value) return
  if (!vehicleResultText.value || !vehicleResultLocation.value) {
    ElMessage.warning('请填写维修说明并获取位置信息')
    return
  }
  try {
    const formData = new FormData()
    formData.append('resultText', vehicleResultText.value)
    formData.append('latitude', vehicleResultLocation.value.latitude)
    formData.append('longitude', vehicleResultLocation.value.longitude)
    formData.append('maintainerId', String(user.value.id))
    if (vehicleResultPhotoFile.value) {
      formData.append('photo', vehicleResultPhotoFile.value)
    }
    await axios.post(`/api/maintenance-vehicles/${currentVehicle.value.id}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    ElMessage.success('车辆维修已完成')
    vehicleDialogVisible.value = false
    // Remove the repaired vehicle from the list
    maintenanceVehicles.value = maintenanceVehicles.value.filter(v => v.id !== currentVehicle.value.id)
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '提交失败')
  }
}

onMounted(async () => {
  const u = localStorage.getItem('user')
  if (u) user.value = JSON.parse(u)
  if (user.value.role !== 'MAINTAINER') {
    ElMessage.error('无权限访问维护后台')
    const redirect = user.value?.role === 'TENANT' ? '/home' : '/admin'
    router.replace(redirect)
    return
  }
  await loadTasks()
  await loadMaintenanceVehicles()
})

const logout = () => {
  localStorage.clear()
  ElMessage.success('已退出维护后台')
  router.push('/login')
}
// 地图弹窗相关状态（JS 版本）
const mapDialogVisible = ref(false)
const mapLngLat = ref({
  lng: null,
  lat: null,
})

let mapInstance = null
let mapMarker = null

// 你提供的高德地图加载函数（直接用你的 key）
const loadAMap = () =>
    new Promise((resolve) => {
      if (window.AMap) return resolve(window.AMap)
      const script = document.createElement('script')
      script.src =
          'https://webapi.amap.com/maps?v=2.0&key=439942f223315c82fa3695c7902ad31f&plugin=AMap.ControlBar'
      script.onload = () => resolve(window.AMap)
      document.head.appendChild(script)
    })

// 初始化 / 切换地图位置
const initMap = async () => {
  if (!mapLngLat.value.lng || !mapLngLat.value.lat) return

  const AMap = await loadAMap()
  const center = [
    Number(mapLngLat.value.lng),
    Number(mapLngLat.value.lat),
  ]

  if (!mapInstance) {
    // 创建地图
    mapInstance = new AMap.Map('amap-container', {
      zoom: 16,
      center,
    })
    // 控件
    mapInstance.addControl(new AMap.ControlBar())
    // 标记点
    mapMarker = new AMap.Marker({
      position: center,
    })
    mapInstance.add(mapMarker)
  } else {
    // 已有地图，只更新中心点和标记
    mapInstance.setCenter(center)
    if (mapMarker) {
      mapMarker.setPosition(center)
    }
  }
}

// 打开弹窗，设置经纬度
const openMapDialog = (lng, lat) => {
  mapLngLat.value = {
    lng: Number(lng),
    lat: Number(lat),
  }
  mapDialogVisible.value = true

  // 等弹窗渲染出 div 再初始化地图
  nextTick(() => {
    initMap()
  })
}

// 弹窗关闭时销毁地图
watch(mapDialogVisible, (val) => {
  if (!val && mapInstance) {
    mapInstance.destroy()
    mapInstance = null
    mapMarker = null
  }
})


</script>

<style scoped>
@import './admin-style.css';

/* 让主体区域有一点留白 */
.main-content {
  padding: 20px 0 32px;
}

/* 统一卡片头部样式 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}

.card-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: #9ca3af;
}

/* 两个列表的整体容器 */
.lists-wrapper {
  padding: 4px 0 8px;
}

.lists-row {
  align-items: stretch;
}

/* 每个列表的卡片块 */
.list-block {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16px;
  padding: 14px 18px 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(8px);
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 标题区域 */
.list-block-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.list-block-header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.list-block-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.list-block-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.list-block-subtitle {
  font-size: 12px;
  color: #9ca3af;
}

.section-icon {
  font-size: 18px;
}

/* 让表格撑满剩余空间，对齐高度 */
.complaint-tasks-content,
.maintenance-vehicles-content {
  flex: 1;
}

/* 弹窗里的布局小优化 */
.location-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.location-text {
  font-size: 13px;
  color: #374151;
}

.photo-preview-wrapper {
  margin-top: 8px;
}

.photo-preview-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
}

/* 统一对齐弹窗底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.location-clickable {
  cursor: pointer;
  color: #2563eb;
  line-height: 1.4;
}

.location-clickable:hover {
  text-decoration: underline;
}

.map-container {
  width: 100%;
  height: 360px;
  border-radius: 8px;
  overflow: hidden;
}

.map-coords {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}


/* 小屏幕时两块上下排列，留点间距 */
@media (max-width: 768px) {
  .list-block {
    margin-bottom: 12px;
  }
}
</style>

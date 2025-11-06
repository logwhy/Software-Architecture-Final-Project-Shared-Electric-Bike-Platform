<template>
  <div class="riding-container">
    <!-- 背景动效 -->
    <div class="bg-animation"></div>

    <!-- 顶部导航 -->
    <el-affix :offset="0">
      <div class="header">
        <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
        <span class="title">骑行中</span>
        <el-button type="danger" round size="small" @click="finishRide" :loading="finishing">
          结束骑行
        </el-button>
      </div>
    </el-affix>

    <!-- 主内容卡片 -->
    <div class="content">
      <el-card class="ride-card" shadow="hover">
        <!-- 车辆信息 -->
        <div class="vehicle-info">
          <el-avatar :size="80" :src="bikeIcon" class="bike-avatar" />
          <div class="info-text">
            <h2 class="code">{{ vehicle?.code || '加载中...' }}</h2>
            <p class="status">电量剩余 {{ battery }}% · 已骑行 {{ formatDuration(elapsed) }}</p>
          </div>
        </div>

        <!-- 费用大屏 -->
        <div class="fee-display">
          <div class="currency">¥</div>
          <div class="amount">{{ fee.toFixed(2) }}</div>
          <div class="unit">元</div>
        </div>

        <!-- 计时器 -->
        <div class="timer">
          <el-icon><Timer /></el-icon>
          <span>{{ formatDuration(elapsed) }}</span>
        </div>

        <!-- 提示 -->
        <div class="tip">
          <el-icon><InfoFilled /></el-icon>
          <span>请在安全区域停车后结束骑行</span>
        </div>
      </el-card>
    </div>

    <!-- 底部安全提示 -->
    <div class="footer-tip">
      <el-icon><Warning /></el-icon>
      <span>请遵守交通规则，佩戴头盔</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Timer, InfoFilled, Warning } from '@element-plus/icons-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const vehicleId = route.params.vehicleId
const vehicle = ref(null)
const ride = ref(null)
const fee = ref(0)
const elapsed = ref(0)
const finishing = ref(false)
const battery = ref(78) // 模拟电量

let timer = null
let startTime = Date.now()

const bikeIcon = 'https://shadow.elemecdn.com/app/element/bike-icon.png'

onMounted(() => {
  loadRideInfo()
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  localStorage.removeItem('current_ride')
})

const loadRideInfo = () => {
  const saved = localStorage.getItem('current_ride')
  if (!saved) {
    ElMessage.error('无骑行记录，请重新扫码')
    router.push('/map')
    return
  }
  try {
    ride.value = JSON.parse(saved)
    if (!ride.value?.id) {
      ElMessage.error('骑行记录损坏')
      localStorage.removeItem('current_ride')
      router.push('/map')
      return
    }
  } catch {
    ElMessage.error('骑行记录损坏')
    localStorage.removeItem('current_ride')
    router.push('/map')
  }

  vehicle.value = { code: `EBK-${vehicleId}` }
}


const startTimer = () => {
  timer = setInterval(() => {
    elapsed.value = Math.floor((Date.now() - startTime) / 1000)
    const minutes = elapsed.value / 60
    fee.value = Math.max(minutes * 1.5, 1.5) // 1.5元/分钟，最低1.5元
  }, 1000)
}

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}分${s}秒`
}

const finishRide = async () => {
  if (!ride.value?.id) {
    ElMessage.error('无骑行记录')
    return
  }

  finishing.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.post('/api/ride/finish', {
      rideId: ride.value.id
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    ElMessage.success(`骑行结束！共计 ¥${res.data.fee}`)
    localStorage.removeItem('current_ride')
    router.push('/map')
  } catch (err) {
    console.error('结束骑行失败:', err.response?.data || err)  // 关键！
    ElMessage.error(err.response?.data?.message || '结束失败，请重试')
  } finally {
    finishing.value = false
    clearInterval(timer)
  }
}

const goBack = () => {
  router.push('/map')
}
</script>

<style scoped>
.riding-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  color: #fff;
}

.bg-animation {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==') center/cover;  opacity: 0.1;
  animation: float 20s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30px); }
}

.header {
  height: 60px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-weight: 600;
}

.back-icon {
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.3s;
}

.back-icon:hover {
  transform: translateX(-4px);
}

.title {
  font-size: 18px;
}

.content {
  padding: 80px 20px 20px;
  display: flex;
  justify-content: center;
}

.ride-card {
  width: 100%;
  max-width: 380px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 24px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.vehicle-info {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 16px;
}

.bike-avatar {
  background: rgba(255, 255, 255, 0.3);
  padding: 8px;
  border-radius: 50%;
}

.info-text .code {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.info-text .status {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.fee-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  padding: 30px 20px;
  gap: 8px;
  font-weight: 700;
}

.currency {
  font-size: 32px;
}

.amount {
  font-size: 64px;
  line-height: 1;
}

.unit {
  font-size: 24px;
  opacity: 0.9;
}

.timer {
  text-align: center;
  font-size: 18px;
  margin: 20px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tip {
  text-align: center;
  font-size: 14px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 20px;
}

.footer-tip {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>

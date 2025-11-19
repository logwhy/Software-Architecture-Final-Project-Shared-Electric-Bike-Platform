<!-- src/views/HomeView.vue -->
<template>
  <div class="home-container">
    <!-- 顶部用户信息 -->
    <el-affix :offset="0">
      <div class="header">
        <div class="user-info">
          <el-avatar :size="42" :icon="UserFilled" class="user-avatar" />
          <div class="info">
            <div class="name">{{ user.name }}</div>
            <div class="role">{{ roleMap[user.role] }}</div>
          </div>
        </div>

        <div class="header-actions">
          <el-button v-if="user.role !== 'TENANT'" type="primary" plain @click="switchToAdmin">切换到管理后台</el-button>
          <el-button type="danger" plain @click="logout" class="logout-btn">
            <el-icon><SwitchButton /></el-icon>
            <span>退出登录</span>
          </el-button>
        </div>
      </div>
    </el-affix>

    <!-- 主内容：左侧菜单 + 右侧视图 -->
    <div class="main-content">
      <!-- 左侧菜单 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <el-icon><Menu /></el-icon>
          <span>功能菜单</span>
        </div>
        <el-menu
            :default-active="activeTab"
            @select="handleTabChange"
            class="custom-menu"
        >
          <el-menu-item index="map" class="menu-item">
            <el-icon class="menu-icon"><Location /></el-icon>
            <span class="menu-text">地图找车</span>
          </el-menu-item>
          <el-menu-item index="riding" :disabled="!hasOngoingRide" class="menu-item">
            <el-icon class="menu-icon"><Bicycle /></el-icon>
            <span class="menu-text">
              骑行中
            </span>
          </el-menu-item>

          <el-menu-item index="complaint" class="menu-item">
            <el-icon class="menu-icon"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg></el-icon>
            <span class="menu-text">我要投诉</span>
          </el-menu-item>
          <!-- 修改后的“进入群聊”按钮 -->
          <el-button class="menu-item"  type="text" @click="$router.push('/chat')">

            <el-icon class="menu-icon">
              <!-- 使用适当的图标 -->
              <ChatIcon /> <!-- 假设这是你想用的图标 -->
            </el-icon>
            <el-icon class="menu-icon"><ChatSquare /></el-icon>
            <span class="menu-text">进入群聊</span>
          </el-button>




        </el-menu>
      </div>

      <!-- 右侧内容 -->
      <div class="content-area">
        <keep-alive>
          <MapView v-if="activeTab === 'map'" />
          <RidingView v-else />
        </keep-alive>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Location,
  Bicycle,
  UserFilled,
  SwitchButton,
  Menu
} from '@element-plus/icons-vue'
import MapView from './MapView.vue'
import RidingView from './RidingView.vue'

const router = useRouter()
const user = ref({})
const activeTab = ref('map')
const currentRide = ref(null)

const roleMap = { TENANT: '租客', OPERATOR: '运营', MAINTAINER: '维护员', PARK_ADMIN: '管理员' }

const hasOngoingRide = computed(() => !!currentRide.value?.id)

// 实时更新骑行状态
const updateRideStatus = () => {
  const ride = localStorage.getItem('current_ride')
  const parsed = ride ? JSON.parse(ride) : null
  currentRide.value = parsed

  if (parsed?.id && activeTab.value !== 'riding') {
    activeTab.value = 'riding'
    ElMessage.success(`开始骑行 ${parsed.vehicle_code}`)
  } else if (!parsed && activeTab.value === 'riding') {
    activeTab.value = 'map'
  }
}

onMounted(() => {
  const u = localStorage.getItem('user')
  if (u) user.value = JSON.parse(u)
  updateRideStatus()

  // 监听 storage 变化 + 自定义事件
  window.addEventListener('storage', updateRideStatus)
  window.addEventListener('ride-started', updateRideStatus)
  window.addEventListener('ride-ended', updateRideStatus)

  // 轮询兜底
  const interval = setInterval(updateRideStatus, 1000)
  onUnmounted(() => {
    clearInterval(interval)
    window.removeEventListener('storage', updateRideStatus)
    window.removeEventListener('ride-started', updateRideStatus)
    window.removeEventListener('ride-ended', updateRideStatus)
  })
})

const switchToAdmin = () => {
  router.push('/admin')
}

const handleTabChange = (key) => {
  if (key === 'riding' && !hasOngoingRide.value) {
    ElMessage.warning('您当前没有正在进行的骑行')
    return
  }
  if (key === 'complaint') {
    router.push('/complaint')
    return
  }
  activeTab.value = key
}

const logout = () => {
  localStorage.clear()
  currentRide.value = null
  ElMessage.success('已退出')
  router.push('/login')
}
</script>

<style scoped>
.home-container {
  height: 100dvh;           /* 兼容新浏览器的地址栏变化 */
  min-height: 100vh;        /* 老浏览器兜底 */
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}


.header {
  height: 64px;
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between; /* 更改为space-between */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e4e7ed;
}

/* 新增样式 */
.header-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  /* 头部左右内边距缩小一点 */
  .header {
    padding: 0 12px;
  }

  /* 顶部按钮区域：挤一挤 + 支持横向滚动 */
  .header-actions {
    flex: 1;                         /* 占满右侧空间 */
    justify-content: flex-end;       /* 靠右排 */
    gap: 6px;                        /* 按钮之间距离缩小 */
    overflow-x: auto;                /* 超出时横向滚动 */
    -webkit-overflow-scrolling: touch;
    white-space: nowrap;             /* 按钮不换行，横向排成一条 */
  }

  /* 隐藏手机端的横向滚动条（可选） */
  .header-actions::-webkit-scrollbar {
    display: none;
  }

  /* 按钮本身再瘦一点 */
  .header-actions .el-button {
    flex: 0 0 auto;                  /* 不要被压缩成很窄 */
    padding: 0 10px;
    height: 30px;
    font-size: 12px;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info .name {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.info .role {
  font-size: 12px;
  color: #909399;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.logout-btn {
  border-radius: 6px;
  padding: 8px 16px;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
  border-bottom: 1px solid #e4e7ed;
  background: #f8fafc;
}

.custom-menu {
  border: none;
  flex: 1;
}

.menu-item {
  margin: 4px 12px;
  border-radius: 6px;
  height: 48px;
}

.menu-item:hover {
  background: #f0f7ff;
}

.menu-item.is-active {
  background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
  color: white;
}

.menu-item.is-active .menu-icon {
  color: white;
}

.menu-icon {
  font-size: 18px;
}

.menu-text {
  font-weight: 500;
}

.content-area {
  flex: 1;
  padding: 0;
  overflow: auto;
  background: #f9fafc;
  height: 100%;
}
@media (max-width: 768px) {
  /* 顶部栏更紧凑一点 */
  .header {
    height: 40px;
    padding: 0;
  }

  .user-info {
    gap: 8px;
  }

  .name {
    font-size: 14px;
  }

  .role {
    font-size: 12px;
  }

  .header-actions {
    padding: 0;           /* 移除内边距 */
    margin: 0;            /* 移除外边距 */
    width: 100%;
    gap: 8px;
  }

  .header-actions {
    flex: 1;                         /* 占满右侧空间 */
    justify-content: flex-end;       /* 靠右排 */
    gap: 6px;                        /* 按钮之间距离缩小 */
    overflow-x: auto;                /* 超出时横向滚动 */
    -webkit-overflow-scrolling: touch;
    white-space: nowrap;             /* 按钮不换行，横向排成一条 */
  }

  /* 主体从 左右布局 -> 上下布局 */
  .main-content {
    flex-direction: column;
  }

  /* 左侧菜单改成顶部导航条 */
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ebeef5;
    padding: 8px 8px 4px;
  }

  .sidebar-header {
    font-size: 13px;
    margin-bottom: 4px;
  }

  /* el-menu 改成一排横向 tab 样式 */
  .custom-menu {
    display: flex;
    flex-direction: row;
    border-right: none;
    border-bottom: none;
  }

  .custom-menu .el-menu-item {
    flex: 1;
    justify-content: center;
    padding: 8px 0;
  }

  .menu-icon {
    font-size: 16px;
  }

  .menu-text {
    font-size: 12px;
  }

  /* 右侧内容占满剩余高度，避免下面留白 */
  .content-area {
    flex: 1;
    height: auto;
    overflow: hidden; /* 防止双层滚动 */
  }

  /* 让 MapView / RidingView 自己内部滚动 */
  .content-area > * {
    height: 100%;
    overflow: auto;
  }
  /* 隐藏手机端的横向滚动条（可选） */
  .header-actions::-webkit-scrollbar {
    display: flex;
  }

  /* 按钮本身再瘦一点 */
  .header-actions .el-button {
    flex: 0 0 auto;                  /* 不要被压缩成很窄 */
    padding: 0 10px;
    height: 30px;
    font-size: 12px;
  }
}
</style>

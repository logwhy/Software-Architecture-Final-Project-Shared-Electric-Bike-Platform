<template>
  <div class="login-container">
    <div class="background-wrapper">
      <div class="bg-animation"></div>
    </div>

    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-content">
            <el-icon class="header-icon"><Lock /></el-icon>
            <span class="header-title">用户登录</span>
          </div>
          <el-tag type="primary" effect="plain" class="welcome-tag">
            欢迎回来
          </el-tag>
        </div>
      </template>

      <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          class="login-form"
          label-position="top"
      >
        <el-form-item label="手机号" prop="phone" class="form-item">
          <el-input
              v-model="form.phone"
              placeholder="请输入手机号"
              size="large"
              :prefix-icon="Phone"
              class="custom-input"
              maxlength="11"
              clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password" class="form-item">
          <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
              size="large"
              :prefix-icon="Lock"
              class="custom-input"
          />
        </el-form-item>

        <el-form-item class="form-item">
          <el-button
              type="primary"
              size="large"
              class="login-btn"
              @click="login"
              :loading="loading"
          >
            <el-icon><Check /></el-icon>
            <span>{{ loading ? '登录中...' : '立即登录' }}</span>
          </el-button>
        </el-form-item>

        <div class="register-link">
          <span class="tip-text">还没有账号？</span>
          <el-button
              type="text"
              @click="goRegister"
              class="register-btn"
          >
            <el-icon><User /></el-icon>
            <span>立即注册</span>
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { Lock, Phone, Check, User } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({ phone: '', password: '' })
const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const login = async () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      const { data } = await axios.post('/api/auth/login', form)

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      ElMessage.success('登录成功！')

      // 优先使用 redirect 参数，否则根据角色
      const redirect = router.currentRoute.value.query.redirect || (data.user.role === 'TENANT' ? '/home' : '/admin')
      router.push(redirect).catch(() => {})
    } catch (e) {
      ElMessage.error(e.response?.data?.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}

const goRegister = () => router.push('/register')
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: hidden;
}

.background-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
}

.bg-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="%23409eff" opacity="0.05" d="M288 480a96 96 0 1 0 0-192 96 96 0 0 0 0 192zm0-128a32 32 0 1 1 0 64 32 32 0 0 1 0-64zM736 480a96 96 0 1 0 0-192 96 96 0 0 0 0 192zm0-128a32 32 0 1 1 0 64 32 32 0 0 1 0-64zM832 64H192c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-96 224H288c-17.7 0-32 14.3-32 32v256c0 17.7 14.3 32 32 32h448c17.7 0 32-14.3 32-32V320c0-17.7-14.3-32-32-32zm-448 64h448v256H288V384z"/></svg>') center/cover;
  animation: float 20s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.login-card {
  width: 100%;
  max-width: 440px;
  border-radius: 16px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: #fff;
  position: relative;
  z-index: 1;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
  color: #409eff;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.welcome-tag {
  font-weight: 500;
}

.login-form {
  padding: 0 8px;
}

.form-item {
  margin-bottom: 24px;
}

:deep(.form-item .el-form-item__label) {
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
  font-size: 14px;
  display: block;
  width: 100%;
}

.custom-input {
  width: 100%;
}

:deep(.custom-input .el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
  padding: 0 12px;
  width: 100%;
}

:deep(.custom-input .el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
  background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

.register-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.tip-text {
  color: #909399;
  font-size: 14px;
}

.register-btn {
  color: #409eff;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
}

.register-btn:hover {
  color: #79bbff;
  background: #f0f7ff;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    max-width: 100%;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .form-item {
    margin-bottom: 20px;
  }

  .register-link {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}

/* 输入框对齐优化 */
:deep(.el-form-item__content) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

:deep(.el-input) {
  width: 100%;
}
</style>

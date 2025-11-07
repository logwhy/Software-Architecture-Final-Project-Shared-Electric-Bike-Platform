<!-- src/views/RegisterView.vue -->
<template>
  <div class="register-container">
    <div class="background-wrapper">
      <div class="bg-animation"></div>
    </div>

    <el-card class="register-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-content">
            <el-icon class="header-icon"><User /></el-icon>
            <span class="header-title">注册账号</span>
          </div>
          <el-tag type="primary" effect="plain" class="welcome-tag">
            欢迎加入
          </el-tag>
        </div>
      </template>

      <el-form
          :model="form"
          :rules="rules"
          ref="formRef"
          class="register-form"
          label-position="top"
      >
        <el-form-item label="手机号" prop="phone" class="form-item">
          <el-input
              v-model="form.phone"
              placeholder="请输入手机号"
              size="large"
              :prefix-icon="Iphone"
              class="custom-input"
              maxlength="11"
          />
        </el-form-item>

        <el-form-item label="用户名" prop="name" class="form-item">
          <el-input
              v-model="form.name"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              class="custom-input"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password" class="form-item">
          <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="custom-input"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword" class="form-item">
          <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="custom-input"
          />
        </el-form-item>

        <el-form-item label="角色" prop="role" class="form-item">
          <el-select
              v-model="form.role"
              placeholder="请选择角色"
              size="large"
              class="custom-select"
          >
            <el-option label="租客" value="TENANT" />
            <el-option label="运营" value="OPERATOR" />
            <el-option label="维护员" value="MAINTAINER" />
            <el-option label="管理员" value="PARK_ADMIN" />
          </el-select>
        </el-form-item>

        <!-- 密钥输入：非租客显示 -->
        <el-form-item
            v-if="form.role !== 'TENANT'"
            label="管理员密钥"
            prop="secretKey"
            class="form-item"
        >
          <el-input
              v-model="form.secretKey"
              type="password"
              placeholder="请输入管理员密钥"
              size="large"
              :prefix-icon="Key"
              show-password
              class="custom-input"
          />
          <div class="secret-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>非租客角色需要验证管理员密钥</span>
          </div>
        </el-form-item>

        <el-form-item class="form-item">
          <el-button
              type="primary"
              @click="register"
              :loading="loading"
              class="register-btn"
              size="large"
          >
            <el-icon><Check /></el-icon>
            <span>{{ loading ? '注册中...' : '立即注册' }}</span>
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer-section">
        <el-divider content-position="center">已有账号？</el-divider>
        <el-button
            type="text"
            @click="router.push('/login')"
            class="login-link"
        >
          <el-icon><ArrowLeft /></el-icon>
          <span>返回登录</span>
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import {
  User,
  Lock,
  Key,
  Check,
  InfoFilled,
  ArrowLeft,
  Iphone
} from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  phone: '',
  name: '',
  password: '',
  confirmPassword: '',
  role: 'TENANT',
  secretKey: ''
})

// 手机号校验
const validatePhone = (rule, value, callback) => {
  const reg = /^1[3-9]\d{9}$/
  if (!value) {
    callback(new Error('请输入手机号'))
  } else if (!reg.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const validateSecretKey = (rule, value, callback) => {
  if (form.role !== 'TENANT' && value !== 'admin@123') {
    callback(new Error('密钥错误'))
  } else {
    callback()
  }
}

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePassword, trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  secretKey: [
    { validator: validateSecretKey, trigger: 'blur' }
  ]
}

const register = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const payload = {
        phone: form.phone,
        name: form.name,
        password: form.password,
        role: form.role
      }
      if (form.role !== 'TENANT') {
        payload.secretKey = form.secretKey
      }

      await axios.post('/api/auth/register', payload)
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } catch (err) {
      ElMessage.error(err.response?.data?.message || '注册失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.register-container {
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

.register-card {
  width: 100%;
  max-width: 480px;
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

.register-form {
  padding: 0 8px;
}

.form-item {
  margin-bottom: 20px;
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

.custom-select {
  width: 100%;
}

:deep(.custom-select .el-select__wrapper) {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
  padding: 0 12px;
  width: 100%;
}

:deep(.custom-select .el-select__wrapper:hover) {
  border-color: #c0c4cc;
}

:deep(.custom-select .el-select__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.secret-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.secret-tip .el-icon {
  color: #e6a23c;
}

.register-btn {
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

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

.register-btn:active {
  transform: translateY(0);
}

.footer-section {
  margin-top: 24px;
}

:deep(.el-divider__text) {
  background: #fff;
  color: #909399;
  font-size: 14px;
}

.login-link {
  width: 100%;
  color: #409eff;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  border-radius: 6px;
}

.login-link:hover {
  color: #79bbff;
  background: #f0f7ff;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-container {
    padding: 16px;
  }

  .register-card {
    max-width: 100%;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .form-item {
    margin-bottom: 16px;
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

:deep(.el-select) {
  width: 100%;
}
</style>

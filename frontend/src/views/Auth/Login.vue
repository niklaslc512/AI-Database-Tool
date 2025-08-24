<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="login-background">
      <div class="bg-pattern"></div>
      <div class="bg-gradient"></div>
    </div>
    
    <!-- 主要内容 -->
    <div class="login-content">
      <!-- 品牌区域 -->
      <div class="brand-section">
        <div class="brand-logo">
          <div class="logo-icon">
            <div class="ai-symbol">AI</div>
          </div>
          <div class="logo-text">
            <h1 class="brand-title">AI数据库管理</h1>
            <p class="brand-subtitle">智能化数据库操作平台</p>
          </div>
        </div>
        
        <!-- 特性展示 -->
        <div class="features-list">
          <div class="feature-item">
            <div class="feature-icon">
              <CircleStackIcon class="w-5 h-5" />
            </div>
            <span>多数据库支持</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <SparklesIcon class="w-5 h-5" />
            </div>
            <span>AI智能查询</span>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <ShieldCheckIcon class="w-5 h-5" />
            </div>
            <span>安全可靠</span>
          </div>
        </div>
      </div>
      
      <!-- 登录表单 -->
      <div class="form-section">
        <div class="form-container">
          <div class="form-header">
            <h2 class="form-title">欢迎回来</h2>
            <p class="form-subtitle">请登录您的账户继续使用</p>
          </div>
          
          <form @submit.prevent="handleLogin" class="login-form">
            <!-- 用户名输入 -->
            <div class="form-group">
              <label class="form-label">用户名或邮箱</label>
              <div class="form-input-wrapper">
                <UserIcon class="input-icon" />
                <input
                  v-model="loginForm.username"
                  type="text"
                  class="form-input"
                  placeholder="请输入用户名或邮箱"
                  :class="{ 'error': errors.username }"
                  @blur="validateUsername"
                />
              </div>
              <div v-if="errors.username" class="form-error">
                {{ errors.username }}
              </div>
            </div>
            
            <!-- 密码输入 -->
            <div class="form-group">
              <label class="form-label">密码</label>
              <div class="form-input-wrapper">
                <LockClosedIcon class="input-icon" />
                <input
                  v-model="loginForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="form-input"
                  placeholder="请输入密码"
                  :class="{ 'error': errors.password }"
                  @blur="validatePassword"
                  @keyup.enter="handleLogin"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                >
                  <EyeIcon v-if="showPassword" class="w-5 h-5" />
                  <EyeSlashIcon v-else class="w-5 h-5" />
                </button>
              </div>
              <div v-if="errors.password" class="form-error">
                {{ errors.password }}
              </div>
            </div>
            
            <!-- 记住我和忘记密码 -->
            <div class="form-options">
              <label class="checkbox-wrapper">
                <input v-model="rememberMe" type="checkbox" class="checkbox-input" />
                <div class="checkbox-custom"></div>
                <span class="checkbox-label">记住我</span>
              </label>
              <router-link to="/forgot-password" class="forgot-password">
                忘记密码？
              </router-link>
            </div>
            
            <!-- 登录按钮 -->
            <button type="submit" class="login-button" :disabled="isLoading || !isFormValid">
              <div v-if="isLoading" class="loading-spinner">
                <div class="spinner"></div>
              </div>
              <span>{{ isLoading ? '登录中...' : '登录' }}</span>
            </button>
            
            <!-- 注册链接 -->
            <div class="register-link">
              <span>还没有账户？</span>
              <router-link to="/register" class="register-btn">立即注册</router-link>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- 主题切换 -->
    <ThemeToggle class="theme-toggle-fixed" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  UserIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CircleStackIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import ThemeToggle from '@/components/UI/ThemeToggle.vue'
import type { LoginRequest } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// 响应式数据
const isLoading = ref(false)
const showPassword = ref(false)
const rememberMe = ref(false)

const loginForm = reactive<LoginRequest>({
  username: '',
  password: '',
  rememberMe: false
})

const errors = reactive({
  username: '',
  password: ''
})

// 计算属性
const isFormValid = computed(() => {
  return loginForm.username.length >= 3 && 
         loginForm.password.length >= 6 && 
         !errors.username && 
         !errors.password
})

// 验证方法
const validateUsername = () => {
  errors.username = ''
  if (!loginForm.username) {
    errors.username = '请输入用户名或邮箱'
  } else if (loginForm.username.length < 3) {
    errors.username = '用户名至少3个字符'
  } else if (loginForm.username.length > 50) {
    errors.username = '用户名不能超过50个字符'
  }
}

const validatePassword = () => {
  errors.password = ''
  if (!loginForm.password) {
    errors.password = '请输入密码'
  } else if (loginForm.password.length < 6) {
    errors.password = '密码至少6个字符'
  } else if (loginForm.password.length > 100) {
    errors.password = '密码不能超过100个字符'
  }
}

// 登录处理
const handleLogin = async () => {
  // 验证表单
  validateUsername()
  validatePassword()
  
  if (!isFormValid.value) return
  
  try {
    isLoading.value = true
    
    await authStore.login({
      ...loginForm,
      rememberMe: rememberMe.value
    })
    
    // 登录成功后跳转
    router.push('/app/dashboard')
    
  } catch (error: any) {
    if (error.code === 'INVALID_CREDENTIALS') {
      errors.username = '用户名或密码错误'
      errors.password = '用户名或密码错误'
    } else {
      errors.username = error.message || '登录失败，请稍后重试'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
@reference '../../styles/main.css';

.login-container {
  @apply min-h-screen relative overflow-hidden;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.dark .login-container {
  background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
}

.login-background {
  @apply absolute inset-0 pointer-events-none;
}

.bg-pattern {
  @apply absolute inset-0 opacity-5;
  background-image: radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0);
  background-size: 20px 20px;
}

.bg-gradient {
  @apply absolute inset-0;
  background: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
}

.login-content {
  @apply relative z-10 min-h-screen flex items-center justify-center p-4;
  @apply lg:grid lg:grid-cols-2 lg:gap-12 lg:max-w-6xl lg:mx-auto;
}

.brand-section {
  @apply hidden lg:flex lg:flex-col lg:justify-center lg:items-start lg:space-y-8;
}

.brand-logo {
  @apply flex items-center space-x-4;
}

.logo-icon {
  @apply w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.ai-symbol {
  @apply text-white font-bold text-xl;
}

.logo-text {
  @apply space-y-1;
}

.brand-title {
  @apply text-3xl font-bold text-gray-900 dark:text-white;
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dark .brand-title {
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  @apply text-lg text-gray-600 dark:text-gray-400;
}

.features-list {
  @apply space-y-4;
}

.feature-item {
  @apply flex items-center space-x-3 text-gray-600 dark:text-gray-400;
}

.feature-icon {
  @apply w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center;
  @apply text-primary-600 dark:text-primary-400;
}

.form-section {
  @apply w-full max-w-md mx-auto lg:max-w-lg;
}

.form-container {
  @apply bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
}

.dark .form-container {
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-header {
  @apply text-center mb-8;
}

.form-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white mb-2;
}

.form-subtitle {
  @apply text-gray-600 dark:text-gray-400;
}

.login-form {
  @apply space-y-6;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input-wrapper {
  @apply relative;
}

.input-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400;
}

.form-input {
  @apply w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600;
  @apply rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
  @apply placeholder-gray-500 dark:placeholder-gray-400;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  @apply transition-all duration-200;
}

.form-input:hover {
  @apply border-gray-400 dark:border-gray-500;
}

.form-input.error {
  @apply border-red-500 focus:ring-red-500;
}

.password-toggle {
  @apply absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600;
  @apply dark:hover:text-gray-300 transition-colors;
}

.form-error {
  @apply text-sm text-red-600 dark:text-red-400 mt-1;
}

.form-options {
  @apply flex items-center justify-between;
}

.checkbox-wrapper {
  @apply flex items-center space-x-2 cursor-pointer;
}

.checkbox-input {
  @apply sr-only;
}

.checkbox-custom {
  @apply w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded;
  @apply bg-white dark:bg-gray-700 transition-all duration-200;
  position: relative;
}

.checkbox-input:checked + .checkbox-custom {
  @apply bg-primary-500 border-primary-500;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  @apply absolute top-0 left-1 w-2 h-3 border-white border-r-2 border-b-2;
  transform: rotate(45deg);
}

.checkbox-label {
  @apply text-sm text-gray-700 dark:text-gray-300;
}

.forgot-password {
  @apply text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400;
  @apply transition-colors;
}

.login-button {
  @apply w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4;
  @apply rounded-lg transition-all duration-200 transform hover:scale-105;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
  @apply flex items-center justify-center space-x-2;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.login-button:hover:not(:disabled) {
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.loading-spinner {
  @apply flex items-center justify-center;
}

.spinner {
  @apply w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin;
}

.register-link {
  @apply text-center text-sm text-gray-600 dark:text-gray-400 space-x-1;
}

.register-btn {
  @apply text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium;
  @apply transition-colors;
}

.theme-toggle-fixed {
  @apply fixed top-6 right-6 z-50;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .login-content {
    @apply block;
  }
  
  .form-section {
    @apply max-w-sm;
  }
  
  .form-container {
    @apply p-6;
  }
}

@media (max-width: 640px) {
  .form-container {
    @apply p-4 mx-2;
  }
  
  .brand-title {
    @apply text-2xl;
  }
  
  .form-title {
    @apply text-xl;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-container {
  animation: fadeInUp 0.6s ease-out;
}

.brand-section {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}
</style>
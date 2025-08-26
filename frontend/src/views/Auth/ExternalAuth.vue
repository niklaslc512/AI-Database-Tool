<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <div class="logo">
          <div class="logo-icon">AI</div>
          <h1>外部授权登录</h1>
        </div>
        <p class="auth-subtitle">通过授权令牌安全访问系统</p>
      </div>

      <!-- 授权令牌登录 -->
      <div v-if="!isValidating" class="auth-form">
        <form @submit.prevent="validateToken" class="token-form">
          <div class="form-group">
            <label class="form-label">授权令牌</label>
            <textarea 
              v-model="authToken" 
              class="form-textarea" 
              placeholder="请输入授权令牌"
              rows="3"
            ></textarea>
            <p class="form-hint">请输入由系统管理员提供的授权令牌</p>
          </div>
          
          <div class="form-actions">
            <BaseButton type="submit" :loading="loading" variant="primary" class="w-full">
              验证并登录
            </BaseButton>
          </div>
        </form>
      </div>

      <!-- 验证中状态 -->
      <div v-else-if="isValidating" class="validating-state">
        <div class="spinner"></div>
        <h3>正在验证授权令牌...</h3>
        <p>请稍候，系统正在验证您的访问权限</p>
      </div>

      <!-- 用户选择 -->
      <div v-else-if="showUserSelection" class="user-selection">
        <h3>选择用户账户</h3>
        <p>请选择要关联的用户账户：</p>
        
        <div class="user-list">
          <button 
            v-for="user in availableUsers" 
            :key="user.id"
            @click="loginWithUser(user.id)"
            class="user-item"
          >
            <div class="user-info">
              <div class="user-name">{{ user.displayName || user.username }}</div>
              <div class="user-role">{{ getRoleName(user.roles) }}</div>
            </div>
          </button>
        </div>
        
        <div class="form-actions">
          <BaseButton @click="goBack" variant="secondary">
            返回
          </BaseButton>
        </div>
      </div>

      <!-- 登录成功 -->
      <div v-else-if="loginSuccess" class="success-state">
        <div class="success-icon">✓</div>
        <h3>登录成功</h3>
        <p>正在跳转到系统...</p>
      </div>

      <!-- 错误状态 -->
      <div v-if="errorMessage" class="error-message">
        <div class="error-icon">⚠</div>
        <p>{{ errorMessage }}</p>
        <BaseButton @click="resetForm" variant="secondary">
          重新尝试
        </BaseButton>
      </div>
    </div>

    <!-- 帮助信息 -->
    <div class="help-section">
      <h4>如何获取授权令牌？</h4>
      <ul>
        <li>联系系统管理员获取临时访问令牌</li>
        <li>通过OAuth授权流程获取访问权限</li>
        <li>使用已有的API密钥进行访问</li>
      </ul>
      
      <div class="help-links">
        <router-link to="/login" class="help-link">
          返回常规登录
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/UI/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const authToken = ref('')
const loading = ref(false)
const isValidating = ref(false)
const showUserSelection = ref(false)
const loginSuccess = ref(false)
const errorMessage = ref('')
const availableUsers = ref<any[]>([])
const validatedToken = ref('')

// 方法
const validateToken = async () => {
  if (!authToken.value.trim()) {
    errorMessage.value = '请输入授权令牌'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    
    const response = await api.post('/auth/external/validate', {
      token: authToken.value.trim()
    })
    
    if (response.success) {
      validatedToken.value = authToken.value.trim()
      
      // 如果令牌已关联用户，直接登录
      if (response.data.token.userId) {
        await loginWithToken(response.data.token.userId)
      } else {
        // 显示用户选择页面
        await loadAvailableUsers()
        showUserSelection.value = true
      }
    } else {
      errorMessage.value = response.message || '令牌验证失败'
    }
  } catch (error: any) {
    errorMessage.value = error.message || '验证过程中发生错误'
  } finally {
    loading.value = false
  }
}

const loadAvailableUsers = async () => {
  try {
    // 这里应该加载可用的用户列表
    // 为了演示，我们使用模拟数据
    availableUsers.value = [
      { id: '1', username: 'admin', displayName: '系统管理员', role: 'admin' },
      { id: '2', username: 'user', displayName: '普通用户', role: 'user' }
    ]
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

const loginWithUser = async (userId: string) => {
  await loginWithToken(userId)
}

const loginWithToken = async (userId?: string) => {
  try {
    isValidating.value = true
    
    const result = await authStore.loginWithExternalToken(validatedToken.value, userId)
    
    loginSuccess.value = true
    
    // 延迟跳转
    setTimeout(() => {
      router.push('/app/dashboard')
    }, 1500)
    
  } catch (error: any) {
    errorMessage.value = error.message || '登录失败'
    isValidating.value = false
  }
}

const getRoleName = (roles: string): string => {
  const roleNames: Record<string, string> = {
    admin: '系统管理员',
    developer: '开发者',
    guest: '访客用户'
  }
  
  if (!roles) return '访客用户'
  
  const roleList = roles.split(',').map(role => role.trim())
  const displayNames = roleList.map(role => roleNames[role] || role)
  
  // 如果有多个角色，显示最高权限的角色
  if (roleList.includes('admin')) return '系统管理员'
  if (roleList.includes('developer')) return '开发者'
  return '访客用户'
}

const goBack = () => {
  showUserSelection.value = false
  isValidating.value = false
}

const resetForm = () => {
  authToken.value = ''
  errorMessage.value = ''
  showUserSelection.value = false
  isValidating.value = false
  loginSuccess.value = false
  validatedToken.value = ''
}

// 检查URL参数中的令牌
onMounted(() => {
  const token = route.query.token as string
  if (token) {
    authToken.value = token
    validateToken()
  }
})
</script>

<style scoped>
@reference '../styles/main.css';

.auth-page {
  @apply min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4;
}

.auth-container {
  @apply bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md;
}

.auth-header {
  @apply text-center mb-8;
}

.logo {
  @apply flex flex-col items-center mb-4;
}

.logo-icon {
  @apply w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center;
  @apply text-white font-bold text-2xl mb-4;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
}

.logo h1 {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.auth-subtitle {
  @apply text-gray-600 dark:text-gray-400;
}

.token-form {
  @apply space-y-6;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg;
  @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
  @apply placeholder-gray-500 dark:placeholder-gray-400;
  @apply focus:ring-2 focus:ring-green-500 focus:border-transparent;
  @apply transition-all duration-200 resize-none;
}

.form-hint {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.form-actions {
  @apply space-y-3;
}

.validating-state, .success-state {
  @apply text-center py-8;
}

.spinner {
  @apply w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4;
}

.success-icon {
  @apply w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4;
  @apply text-white text-2xl font-bold;
}

.validating-state h3, .success-state h3 {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-2;
}

.validating-state p, .success-state p {
  @apply text-gray-600 dark:text-gray-400;
}

.user-selection {
  @apply space-y-6;
}

.user-selection h3 {
  @apply text-lg font-semibold text-gray-900 dark:text-white text-center;
}

.user-selection p {
  @apply text-gray-600 dark:text-gray-400 text-center;
}

.user-list {
  @apply space-y-2;
}

.user-item {
  @apply w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left;
}

.user-info {
  @apply space-y-1;
}

.user-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.user-role {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.error-message {
  @apply bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800;
  @apply rounded-lg p-4 text-center space-y-3;
}

.error-icon {
  @apply text-red-500 text-2xl;
}

.error-message p {
  @apply text-red-700 dark:text-red-300;
}

.help-section {
  @apply mt-8 max-w-md mx-auto;
}

.help-section h4 {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-3;
}

.help-section ul {
  @apply space-y-2 mb-6;
}

.help-section li {
  @apply text-sm text-gray-600 dark:text-gray-400;
  @apply flex items-start;
}

.help-section li::before {
  content: '•';
  @apply text-green-500 mr-2 mt-1;
}

.help-links {
  @apply text-center;
}

.help-link {
  @apply text-green-600 hover:text-green-500 dark:text-green-400;
  @apply transition-colors underline;
}
</style>
<template>
  <div class="profile-page">
    <div class="page-header">
      <h1 class="page-title">个人设置</h1>
      <p class="page-subtitle">管理您的个人信息和偏好设置</p>
    </div>

    <div class="settings-container">
      <!-- 个人信息 -->
      <div class="settings-section">
        <h2 class="section-title">个人信息</h2>
        <form @submit.prevent="updateProfile" class="profile-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <input v-model="user.username" type="text" class="form-input" readonly />
            </div>
            
            <div class="form-group">
              <label class="form-label">显示名称</label>
              <input v-model="profileForm.displayName" type="text" class="form-input" />
            </div>
            
            <div class="form-group">
              <label class="form-label">邮箱地址</label>
              <input v-model="profileForm.email" type="email" class="form-input" />
            </div>
            
            <div class="form-group">
              <label class="form-label">角色</label>
              <input :value="getRoleName(user.role)" type="text" class="form-input" readonly />
            </div>
          </div>
          
          <div class="form-actions">
            <BaseButton type="submit" :loading="updating" variant="primary">
              保存修改
            </BaseButton>
          </div>
        </form>
      </div>

      <!-- 密码修改 -->
      <div class="settings-section">
        <h2 class="section-title">修改密码</h2>
        <form @submit.prevent="changePassword" class="password-form">
          <div class="form-group">
            <label class="form-label">当前密码</label>
            <input v-model="passwordForm.oldPassword" type="password" class="form-input" />
          </div>
          
          <div class="form-group">
            <label class="form-label">新密码</label>
            <input v-model="passwordForm.newPassword" type="password" class="form-input" />
          </div>
          
          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <input v-model="passwordForm.confirmPassword" type="password" class="form-input" />
          </div>
          
          <div class="form-actions">
            <BaseButton type="submit" :loading="changingPassword" variant="primary">
              修改密码
            </BaseButton>
          </div>
        </form>
      </div>

      <!-- 偏好设置 -->
      <div class="settings-section">
        <h2 class="section-title">偏好设置</h2>
        <div class="preferences-grid">
          <div class="preference-item">
            <label class="form-label">主题</label>
            <select v-model="settingsForm.theme" class="form-select">
              <option value="light">浅色主题</option>
              <option value="dark">深色主题</option>
              <option value="auto">跟随系统</option>
            </select>
          </div>
          
          <div class="preference-item">
            <label class="form-label">语言</label>
            <select v-model="settingsForm.language" class="form-select">
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
          
          <div class="preference-item">
            <label class="form-label">时区</label>
            <select v-model="settingsForm.timezone" class="form-select">
              <option value="Asia/Shanghai">中国标准时间</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
        
        <div class="notification-settings">
          <h3 class="subsection-title">通知设置</h3>
          <div class="checkbox-group">
            <label class="checkbox-wrapper">
              <input v-model="settingsForm.notifications.email" type="checkbox" />
              <span class="checkbox-custom"></span>
              <span>邮件通知</span>
            </label>
            
            <label class="checkbox-wrapper">
              <input v-model="settingsForm.notifications.browser" type="checkbox" />
              <span class="checkbox-custom"></span>
              <span>浏览器通知</span>
            </label>
            
            <label class="checkbox-wrapper">
              <input v-model="settingsForm.notifications.security" type="checkbox" />
              <span class="checkbox-custom"></span>
              <span>安全通知</span>
            </label>
          </div>
        </div>
        
        <div class="form-actions">
          <BaseButton @click="saveSettings" :loading="savingSettings" variant="primary">
            保存设置
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import BaseButton from '@/components/UI/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import type { UpdateUserRequest, ChangePasswordRequest, UserSettings } from '@/types'

const authStore = useAuthStore()

// 响应式数据
const updating = ref(false)
const changingPassword = ref(false)
const savingSettings = ref(false)

const user = computed(() => authStore.user!)

const profileForm = reactive<UpdateUserRequest>({
  displayName: '',
  email: ''
})

const passwordForm = reactive<ChangePasswordRequest & { confirmPassword: string }>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const settingsForm = reactive<UserSettings>({
  theme: 'auto',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  notifications: {
    email: true,
    browser: true,
    security: true
  }
})

// 方法
const updateProfile = async () => {
  try {
    updating.value = true
    await authStore.updateProfile(profileForm)
    alert('个人信息更新成功')
  } catch (error: any) {
    alert(error.message || '更新失败')
  } finally {
    updating.value = false
  }
}

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  
  try {
    changingPassword.value = true
    await authStore.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    alert('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error: any) {
    alert(error.message || '密码修改失败')
  } finally {
    changingPassword.value = false
  }
}

const saveSettings = async () => {
  try {
    savingSettings.value = true
    await authStore.updateProfile({ settings: settingsForm })
    alert('设置保存成功')
  } catch (error: any) {
    alert(error.message || '保存失败')
  } finally {
    savingSettings.value = false
  }
}

const getRoleName = (role: string): string => {
  const roleNames: Record<string, string> = {
    admin: '系统管理员',
    user: '普通用户',
    readonly: '只读用户',
    guest: '访客用户'
  }
  return roleNames[role] || role
}

const initializeForms = () => {
  if (user.value) {
    profileForm.displayName = user.value.displayName || ''
    profileForm.email = user.value.email || ''
    
    if (user.value.settings) {
      Object.assign(settingsForm, user.value.settings)
    }
  }
}

onMounted(() => {
  initializeForms()
})
</script>

<style scoped>
@reference '../styles/main.css';

.profile-page {
  @apply max-w-4xl mx-auto px-4 py-8;
}

.page-header {
  @apply mb-8;
}

.page-title {
  @apply text-3xl font-bold text-gray-900 dark:text-white mb-2;
}

.page-subtitle {
  @apply text-gray-600 dark:text-gray-400;
}

.settings-container {
  @apply space-y-8;
}

.settings-section {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700;
}

.section-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-6;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-6;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input, .form-select {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg;
  @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}

.form-input[readonly] {
  @apply bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400;
}

.form-actions {
  @apply flex justify-end;
}

.preferences-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6 mb-6;
}

.preference-item {
  @apply space-y-2;
}

.subsection-title {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-4;
}

.checkbox-group {
  @apply space-y-3 mb-6;
}

.checkbox-wrapper {
  @apply flex items-center space-x-3 cursor-pointer;
}

.checkbox-custom {
  @apply w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded;
  @apply bg-white dark:bg-gray-700 transition-all duration-200;
  position: relative;
}

input[type="checkbox"]:checked + .checkbox-custom {
  @apply bg-primary-500 border-primary-500;
}

input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '';
  @apply absolute top-0 left-1 w-2 h-3 border-white border-r-2 border-b-2;
  transform: rotate(45deg);
}

input[type="checkbox"] {
  @apply sr-only;
}
</style>
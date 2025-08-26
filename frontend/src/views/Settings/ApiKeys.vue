<template>
  <div class=\"api-keys-page\">
    <div class=\"page-header\">
      <h1 class=\"page-title\">API 密钥管理</h1>
      <p class=\"page-subtitle\">管理您的API访问密钥，用于外部应用程序集成</p>
      
      <div class=\"header-actions\">
        <BaseButton @click=\"showCreateDialog = true\" variant=\"primary\">
          <PlusIcon class=\"w-5 h-5\" />
          创建新密钥
        </BaseButton>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class=\"stats-grid\">
      <div class=\"stat-card\">
        <div class=\"stat-icon\">
          <KeyIcon class=\"w-6 h-6 text-blue-600\" />
        </div>
        <div class=\"stat-content\">
          <div class=\"stat-value\">{{ apiKeys.length }}</div>
          <div class=\"stat-label\">总密钥数</div>
        </div>
      </div>
      
      <div class=\"stat-card\">
        <div class=\"stat-icon\">
          <CheckCircleIcon class=\"w-6 h-6 text-green-600\" />
        </div>
        <div class=\"stat-content\">
          <div class=\"stat-value\">{{ activeKeysCount }}</div>
          <div class=\"stat-label\">活跃密钥</div>
        </div>
      </div>
      
      <div class=\"stat-card\">
        <div class=\"stat-icon\">
          <ChartBarIcon class=\"w-6 h-6 text-purple-600\" />
        </div>
        <div class=\"stat-content\">
          <div class=\"stat-value\">{{ totalUsage }}</div>
          <div class=\"stat-label\">总使用次数</div>
        </div>
      </div>
    </div>

    <!-- API密钥列表 -->
    <div class=\"api-keys-list\">
      <div v-if=\"loading\" class=\"loading-state\">
        <div class=\"spinner\"></div>
        <p>加载API密钥...</p>
      </div>
      
      <div v-else-if=\"apiKeys.length === 0\" class=\"empty-state\">
        <KeyIcon class=\"w-16 h-16 text-gray-400\" />
        <h3>暂无API密钥</h3>
        <p>创建您的第一个API密钥来开始使用API服务</p>
        <BaseButton @click=\"showCreateDialog = true\" variant=\"primary\">
          创建API密钥
        </BaseButton>
      </div>
      
      <div v-else class=\"keys-grid\">
        <div 
          v-for=\"apiKey in apiKeys\" 
          :key=\"apiKey.id\" 
          class=\"key-card\"
          :class=\"{ 'inactive': !apiKey.isActive }\"
        >
          <div class=\"key-header\">
            <div class=\"key-info\">
              <h3 class=\"key-name\">{{ apiKey.name }}</h3>
              <div class=\"key-id\">
                <code>{{ apiKey.keyId }}</code>
                <button 
                  @click=\"copyToClipboard(apiKey.keyId)\" 
                  class=\"copy-btn\"
                  title=\"复制密钥ID\"
                >
                  <ClipboardIcon class=\"w-4 h-4\" />
                </button>
              </div>
            </div>
            
            <div class=\"key-status\">
              <span 
                class=\"status-badge\" 
                :class=\"{
                  'active': apiKey.isActive,
                  'inactive': !apiKey.isActive,
                  'expired': isExpired(apiKey.expiresAt)
                }\"
              >
                {{ getStatusText(apiKey) }}
              </span>
            </div>
          </div>
          
          <div class=\"key-details\">
            <div class=\"detail-item\">
              <CalendarIcon class=\"w-4 h-4\" />
              <span>创建时间: {{ formatDate(apiKey.createdAt) }}</span>
            </div>
            
            <div v-if=\"apiKey.expiresAt\" class=\"detail-item\">
              <ClockIcon class=\"w-4 h-4\" />
              <span>过期时间: {{ formatDate(apiKey.expiresAt) }}</span>
            </div>
            
            <div class=\"detail-item\">
              <ChartBarIcon class=\"w-4 h-4\" />
              <span>使用次数: {{ apiKey.usageCount }}</span>
            </div>
            
            <div v-if=\"apiKey.lastUsedAt\" class=\"detail-item\">
              <ClockIcon class=\"w-4 h-4\" />
              <span>最后使用: {{ formatDate(apiKey.lastUsedAt) }}</span>
            </div>
          </div>
          
          <div class=\"key-actions\">
            <button 
              @click=\"editApiKey(apiKey)\" 
              class=\"action-btn edit\"
              title=\"编辑\"
            >
              <PencilIcon class=\"w-4 h-4\" />
            </button>
            
            <button 
              @click=\"deleteApiKey(apiKey)\" 
              class=\"action-btn delete\"
              title=\"删除\"
            >
              <TrashIcon class=\"w-4 h-4\" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建API密钥对话框 -->
    <div v-if=\"showCreateDialog\" class=\"dialog-overlay\" @click=\"closeCreateDialog\">
      <div class=\"dialog\" @click.stop>
        <div class=\"dialog-header\">
          <h2>创建API密钥</h2>
          <button @click=\"closeCreateDialog\" class=\"close-btn\">
            <XMarkIcon class=\"w-5 h-5\" />
          </button>
        </div>
        
        <form @submit.prevent=\"createNewApiKey\" class=\"dialog-content\">
          <div class=\"form-group\">
            <label class=\"form-label\">密钥名称</label>
            <input 
              v-model=\"createForm.name\" 
              type=\"text\" 
              class=\"form-input\" 
              placeholder=\"请输入密钥名称\"
              required
            />
          </div>
          
          <div class=\"form-group\">
            <label class=\"form-label\">过期时间（可选）</label>
            <input 
              v-model=\"createForm.expiresAt\" 
              type=\"datetime-local\" 
              class=\"form-input\"
            />
          </div>
          
          <div class=\"dialog-actions\">
            <BaseButton type=\"button\" @click=\"closeCreateDialog\" variant=\"secondary\">
              取消
            </BaseButton>
            <BaseButton type=\"submit\" :loading=\"creating\" variant=\"primary\">
              创建密钥
            </BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- 密钥创建成功对话框 -->
    <div v-if=\"newApiKeySecret\" class=\"dialog-overlay\">
      <div class=\"dialog\">
        <div class=\"dialog-header\">
          <h2>API密钥创建成功</h2>
        </div>
        
        <div class=\"dialog-content\">
          <div class=\"success-message\">
            <CheckCircleIcon class=\"w-8 h-8 text-green-600\" />
            <p>您的API密钥已成功创建！</p>
          </div>
          
          <div class=\"secret-display\">
            <label class=\"form-label\">API密钥（请立即保存，不会再次显示）</label>
            <div class=\"secret-input\">
              <input 
                :value=\"newApiKeySecret\" 
                type=\"text\" 
                class=\"form-input\" 
                readonly
              />
              <button 
                @click=\"copyToClipboard(newApiKeySecret)\" 
                class=\"copy-btn\"
              >
                <ClipboardIcon class=\"w-5 h-5\" />
              </button>
            </div>
          </div>
          
          <div class=\"warning-message\">
            <ExclamationTriangleIcon class=\"w-5 h-5 text-amber-500\" />
            <p>请立即复制并保存此密钥，关闭此对话框后将无法再次查看。</p>
          </div>
          
          <div class=\"dialog-actions\">
            <BaseButton @click=\"closeSecretDialog\" variant=\"primary\">
              我已保存，关闭
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  PlusIcon,
  KeyIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ClipboardIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { Timer as ClockIcon } from '@/utils/iconMapping'
import BaseButton from '@/components/UI/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import type { ApiKey, CreateApiKeyRequest } from '@/types'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const creating = ref(false)
const showCreateDialog = ref(false)
const newApiKeySecret = ref('')

const createForm = ref<CreateApiKeyRequest>({
  name: '',
  expiresAt: undefined
})

// 计算属性
const apiKeys = computed(() => authStore.apiKeys)
const activeKeysCount = computed(() => apiKeys.value.filter(key => key.isActive).length)
const totalUsage = computed(() => apiKeys.value.reduce((sum, key) => sum + key.usageCount, 0))

// 方法
const loadApiKeys = async () => {
  try {
    loading.value = true
    await authStore.loadApiKeys()
  } catch (error: any) {
    console.error('加载API密钥失败:', error)
  } finally {
    loading.value = false
  }
}

const createNewApiKey = async () => {
  try {
    creating.value = true
    
    const data: CreateApiKeyRequest = {
      name: createForm.value.name,
      expiresAt: createForm.value.expiresAt || undefined
    }
    
    const result = await authStore.createApiKey(data)
    newApiKeySecret.value = result.secret
    closeCreateDialog()
  } catch (error: any) {
    console.error('创建API密钥失败:', error)
    alert(error.message || '创建失败')
  } finally {
    creating.value = false
  }
}

const editApiKey = (apiKey: ApiKey) => {
  // TODO: 实现编辑功能
  console.log('编辑API密钥:', apiKey)
}

const deleteApiKey = async (apiKey: ApiKey) => {
  if (!confirm(`确定要删除API密钥 \"${apiKey.name}\" 吗？此操作不可撤销。`)) {
    return
  }
  
  try {
    await authStore.deleteApiKey(apiKey.id)
  } catch (error: any) {
    console.error('删除API密钥失败:', error)
    alert(error.message || '删除失败')
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // TODO: 显示复制成功提示
    console.log('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
  createForm.value = { name: '', expiresAt: undefined }
}

const closeSecretDialog = () => {
  newApiKeySecret.value = ''
}

const isExpired = (expiresAt?: string): boolean => {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

const getStatusText = (apiKey: ApiKey): string => {
  if (!apiKey.isActive) return '已停用'
  if (isExpired(apiKey.expiresAt)) return '已过期'
  return '活跃'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadApiKeys()
})
</script>

<style scoped>
@reference '../styles/main.css';

.api-keys-page {
  @apply max-w-6xl mx-auto px-4 py-8;
}

.page-header {
  @apply mb-8;
}

.page-title {
  @apply text-3xl font-bold text-gray-900 dark:text-white mb-2;
}

.page-subtitle {
  @apply text-gray-600 dark:text-gray-400 mb-6;
}

.header-actions {
  @apply flex justify-end;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6 mb-8;
}

.stat-card {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700;
  @apply flex items-center space-x-4;
}

.stat-icon {
  @apply w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center;
}

.stat-content {
  @apply flex-1;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.api-keys-list {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700;
}

.loading-state {
  @apply flex flex-col items-center justify-center py-12;
}

.spinner {
  @apply w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.empty-state h3 {
  @apply text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2;
}

.empty-state p {
  @apply text-gray-600 dark:text-gray-400 mb-6;
}

.keys-grid {
  @apply p-6 space-y-4;
}

.key-card {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg p-4;
  @apply hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.key-card.inactive {
  @apply opacity-60;
}

.key-header {
  @apply flex items-start justify-between mb-3;
}

.key-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.key-id {
  @apply flex items-center space-x-2 mt-1;
}

.key-id code {
  @apply text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-gray-700 dark:text-gray-300;
}

.copy-btn {
  @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors;
}

.status-badge {
  @apply px-2 py-1 text-xs font-medium rounded-full;
}

.status-badge.active {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.status-badge.inactive {
  @apply bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300;
}

.status-badge.expired {
  @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

.key-details {
  @apply space-y-2 mb-4;
}

.detail-item {
  @apply flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400;
}

.key-actions {
  @apply flex items-center space-x-2;
}

.action-btn {
  @apply p-2 rounded-lg transition-colors;
}

.action-btn.edit {
  @apply text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20;
}

.action-btn.delete {
  @apply text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20;
}

.dialog-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.dialog {
  @apply bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4;
}

.dialog-header {
  @apply flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.dialog-header h2 {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.close-btn {
  @apply text-gray-400 hover:text-gray-600 dark:hover:text-gray-300;
}

.dialog-content {
  @apply p-6 space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg;
  @apply bg-white dark:bg-gray-700 text-gray-900 dark:text-white;
  @apply focus:ring-2 focus:ring-green-500 focus:border-transparent;
}

.dialog-actions {
  @apply flex items-center justify-end space-x-3 pt-4;
}

.success-message {
  @apply flex items-center space-x-3 text-green-600;
}

.secret-display {
  @apply space-y-2;
}

.secret-input {
  @apply flex items-center space-x-2;
}

.secret-input input {
  @apply flex-1;
}

.warning-message {
  @apply flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg;
  @apply text-amber-700 dark:text-amber-300;
}
</style>
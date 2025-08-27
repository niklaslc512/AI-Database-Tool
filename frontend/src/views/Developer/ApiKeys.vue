<template>
  <div class=" flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 overflow-hidden">
    <!-- 📊 页面头部 -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-gray-200 flex-shrink-0 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l6.879-6.879A6 6 0 0119 9z" />
              </svg>
            </div>
            API 密钥管理
          </h1>
          <p class="text-gray-600 mt-2">
            管理您的API访问密钥，用于外部应用程序集成和数据库访问控制
          </p>
        </div>
        <button 
          @click="showCreateModal = true" 
          class="btn bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          创建密钥
        </button>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="bg-white/70 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">总密钥数</p>
              <p class="text-2xl font-bold text-gray-900">{{ apiKeys.length }}</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l6.879-6.879A6 6 0 0119 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">活跃密钥</p>
              <p class="text-2xl font-bold text-green-600">{{ activeKeysCount }}</p>
            </div>
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">过期密钥</p>
              <p class="text-2xl font-bold text-yellow-600">{{ expiredKeysCount }}</p>
            </div>
            <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">总使用次数</p>
              <p class="text-2xl font-bold text-purple-600">{{ totalUsage }}</p>
            </div>
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden min-h-0">
      <div class="bg-white/70 backdrop-blur-sm flex flex-col shadow-lg overflow-hidden min-h-0 rounded-xl border border-white/20">
        <!-- 表头 -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 class="text-xl font-semibold text-gray-900">API密钥列表</h2>
          <div class="flex items-center gap-4">
            <!-- 搜索框 -->
            <div class="relative">
              <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="搜索密钥名称..." 
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              />
            </div>
            <!-- 筛选器 -->
            <select 
              v-model="statusFilter" 
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            >
              <option value="">全部状态</option>
              <option value="active">活跃</option>
              <option value="inactive">禁用</option>
              <option value="expired">过期</option>
            </select>
          </div>
        </div>

        <!-- 表格内容 -->
        <div class="flex-1 overflow-y-auto min-h-0 p-6">
          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>

          <div v-else-if="filteredApiKeys.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l6.879-6.879A6 6 0 0119 9z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">暂无API密钥</h3>
            <p class="text-gray-600 mb-6">创建您的第一个API密钥来开始使用</p>
            <button 
              @click="showCreateModal = true" 
              class="btn bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0"
            >
              创建API密钥
            </button>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="table table-zebra">
            <thead>
              <tr>
                <th class="font-semibold text-base-content">密钥信息</th>
                <th class="font-semibold text-base-content">权限</th>
                <th class="font-semibold text-base-content">关联数据库</th>
                <th class="font-semibold text-base-content">状态</th>
                <th class="font-semibold text-base-content">使用情况</th>
                <th class="font-semibold text-base-content">创建时间</th>
                <th class="font-semibold text-base-content">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="apiKey in filteredApiKeys" :key="apiKey.id" class="hover">
                <!-- 密钥信息 -->
                <td>
                  <div class="flex flex-col">
                    <div class="font-medium text-base-content">{{ apiKey.name }}</div>
                    <div class="flex items-center gap-2 mt-1">
                      <code class="text-xs bg-base-300 px-2 py-1 rounded font-mono">
                        {{ maskApiKey(apiKey.apiKey) }}
                      </code>
                      <button 
                        @click="copyToClipboard(apiKey.apiKey)" 
                        class="btn btn-ghost btn-xs"
                        title="复制密钥"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </td>

                <!-- 权限 -->
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="permission in apiKey.permissions" 
                      :key="permission" 
                      class="badge badge-outline badge-sm"
                    >
                      {{ getPermissionLabel(permission) }}
                    </span>
                    <span v-if="!apiKey.permissions?.length" class="text-base-content/50 text-sm">
                      无权限
                    </span>
                  </div>
                </td>

                <!-- 关联数据库 -->
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="dbId in apiKey.databaseIds" 
                      :key="dbId" 
                      class="badge badge-primary badge-sm"
                    >
                      {{ getDatabaseName(dbId) }}
                    </span>
                    <span v-if="!apiKey.databaseIds?.length" class="text-base-content/50 text-sm">
                      无关联
                    </span>
                  </div>
                </td>

                <!-- 状态 -->
                <td>
                  <div class="badge" :class="getStatusBadgeClass(apiKey)">
                    {{ getStatusText(apiKey) }}
                  </div>
                </td>

                <!-- 使用情况 -->
                <td>
                  <div class="flex flex-col text-sm">
                    <span class="font-medium">{{ apiKey.usageCount }} 次</span>
                    <span v-if="apiKey.lastUsedAt" class="text-base-content/70">
                      {{ formatRelativeTime(apiKey.lastUsedAt) }}
                    </span>
                    <span v-else class="text-base-content/50">从未使用</span>
                  </div>
                </td>

                <!-- 创建时间 -->
                <td>
                  <div class="text-sm">
                    <div>{{ formatDate(apiKey.createdAt) }}</div>
                    <div class="text-base-content/70">{{ formatTime(apiKey.createdAt) }}</div>
                  </div>
                </td>

                <!-- 操作 -->
                <td>
                  <div class="flex items-center gap-2">
                    <button 
                      @click="editApiKey(apiKey)" 
                      class="btn btn-ghost btn-sm"
                      title="编辑"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      @click="toggleApiKeyStatus(apiKey)" 
                      class="btn btn-ghost btn-sm"
                      :title="apiKey.isActive ? '禁用' : '启用'"
                    >
                      <svg v-if="apiKey.isActive" class="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <svg v-else class="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button 
                      @click="deleteApiKey(apiKey)" 
                      class="btn btn-ghost btn-sm text-error"
                      title="删除"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- 创建/编辑API密钥模态框 -->
    <div v-if="showCreateModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          {{ editingApiKey ? '编辑API密钥' : '创建API密钥' }}
        </h3>
        
        <form @submit.prevent="submitApiKey" class="space-y-4">
          <!-- 密钥名称 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">密钥名称 *</span>
            </label>
            <input 
              v-model="formData.name" 
              type="text" 
              placeholder="请输入密钥名称" 
              class="input input-bordered w-full"
              required
            />
          </div>

          <!-- 权限选择 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">权限设置</span>
            </label>
            <div class="grid grid-cols-1 gap-2">
              <label v-for="permission in availablePermissions" :key="permission.value" class="label cursor-pointer justify-start gap-3 p-3 border border-base-300 rounded-lg hover:bg-base-200 transition-colors">
                <input 
                  v-model="formData.permissions" 
                  :value="permission.value" 
                  type="checkbox" 
                  class="checkbox checkbox-primary"
                />
                <div class="flex-1">
                  <div class="label-text font-medium">{{ permission.label }}</div>
                  <div class="text-xs text-base-content/70 mt-1">{{ permission.description }}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- 数据库关联 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">关联数据库</span>
            </label>
            <div class="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              <label v-for="db in availableDatabases" :key="db.id" class="label cursor-pointer justify-start gap-3">
                <input 
                  v-model="formData.databaseIds" 
                  :value="db.id" 
                  type="checkbox" 
                  class="checkbox checkbox-primary"
                />
                <span class="label-text">{{ db.name }} ({{ db.type }})</span>
              </label>
            </div>
          </div>

          <!-- 过期时间 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">过期时间（可选）</span>
            </label>
            <input 
              v-model="formData.expiresAt" 
              type="datetime-local" 
              class="input input-bordered w-full"
            />
          </div>

          <div class="modal-action">
            <button type="button" @click="closeCreateModal" class="btn btn-ghost">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
              {{ editingApiKey ? '更新' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- API密钥创建成功模态框 -->
    <div v-if="showSuccessModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4 text-success">
          ✅ API密钥创建成功
        </h3>
        
        <div class="alert alert-warning mb-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>请立即保存此密钥，它不会再次显示！</span>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text font-medium">API密钥</span>
          </label>
          <div class="flex gap-2">
            <input 
              :value="newApiKeySecret" 
              type="text" 
              class="input input-bordered flex-1 font-mono" 
              readonly
            />
            <button 
              @click="copyToClipboard(newApiKeySecret)" 
              class="btn btn-outline"
            >
              复制
            </button>
          </div>
        </div>

        <div class="modal-action">
          <button @click="closeSuccessModal" class="btn btn-primary">
            我已保存
          </button>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ApiKey, CreateApiKeyRequest, DatabaseConnection } from '@/types'
import { useToast } from '@/composables/useToast'
import { apiKeyApi, connectionApi } from '@/utils/api'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateModal = ref(false)
const showSuccessModal = ref(false)
const editingApiKey = ref<ApiKey | null>(null)
const newApiKeySecret = ref('')
const searchQuery = ref('')
const statusFilter = ref('')

// API密钥列表
const apiKeys = ref<ApiKey[]>([])
const availableDatabases = ref<DatabaseConnection[]>([])

// 表单数据
const formData = ref<CreateApiKeyRequest>({
  name: '',
  permissions: [],
  databaseIds: [],
  expiresAt: ''
})

// 可用权限
const availablePermissions = ref<Array<{
  value: string
  label: string
  description: string
}>>([])

// Toast 通知
const { showToast } = useToast()

// 计算属性
const activeKeysCount = computed(() => 
  apiKeys.value.filter(key => key.isActive && !isExpired(key.expiresAt)).length
)

const expiredKeysCount = computed(() => 
  apiKeys.value.filter(key => isExpired(key.expiresAt)).length
)

const totalUsage = computed(() => 
  apiKeys.value.reduce((sum, key) => sum + key.usageCount, 0)
)

const filteredApiKeys = computed(() => {
  let filtered = apiKeys.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(key => 
      key.name.toLowerCase().includes(query) ||
      key.apiKey.toLowerCase().includes(query)
    )
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(key => {
      if (statusFilter.value === 'active') {
        return key.isActive && !isExpired(key.expiresAt)
      } else if (statusFilter.value === 'inactive') {
        return !key.isActive
      } else if (statusFilter.value === 'expired') {
        return isExpired(key.expiresAt)
      }
      return true
    })
  }

  return filtered
})

// 工具函数
const maskApiKey = (apiKey: string) => {
  if (apiKey.length <= 8) return apiKey
  return apiKey.substring(0, 8) + '*'.repeat(Math.max(0, apiKey.length - 12)) + apiKey.substring(apiKey.length - 4)
}

const isExpired = (expiresAt?: string) => {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

const getStatusText = (apiKey: ApiKey) => {
  if (isExpired(apiKey.expiresAt)) return '已过期'
  return apiKey.isActive ? '活跃' : '禁用'
}

const getStatusBadgeClass = (apiKey: ApiKey) => {
  if (isExpired(apiKey.expiresAt)) return 'badge-warning'
  return apiKey.isActive ? 'badge-success' : 'badge-error'
}

const getPermissionLabel = (permission: string) => {
  const found = availablePermissions.value.find(p => p.value === permission)
  return found ? found.label : permission
}

const getDatabaseName = (dbId: string) => {
  const db = availableDatabases.value.find(d => d.id === dbId)
  return db ? db.name : `数据库-${dbId.substring(0, 8)}`
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('zh-CN')
}

const formatRelativeTime = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  return `${Math.floor(diffDays / 30)}月前`
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('已复制到剪贴板', 'success')
  } catch (error) {
    showToast('复制失败', 'error')
  }
}

// API操作
const loadApiKeys = async () => {
  loading.value = true
  try {
    apiKeys.value = await apiKeyApi.getApiKeys()
  } catch (error) {
    showToast('加载API密钥失败', 'error')
    console.error('加载API密钥失败:', error)
  } finally {
    loading.value = false
  }
}

const loadDatabases = async () => {
  try {
    availableDatabases.value = await connectionApi.getConnections()
  } catch (error) {
    console.error('加载数据库连接失败:', error)
  }
}

const loadAvailablePermissions = async () => {
  try {
    availablePermissions.value = await apiKeyApi.getAvailablePermissions()
  } catch (error) {
    showToast('加载权限列表失败', 'error')
    console.error('加载权限列表失败:', error)
  }
}

const submitApiKey = async () => {
  submitting.value = true
  try {
    if (editingApiKey.value) {
      // 更新API密钥
      await apiKeyApi.updateApiKey(editingApiKey.value.id, formData.value)
      showToast('API密钥更新成功', 'success')
      closeCreateModal()
      await loadApiKeys()
    } else {
      // 创建API密钥
      const response = await apiKeyApi.createApiKey(formData.value)
      newApiKeySecret.value = response.secret
      showSuccessModal.value = true
      closeCreateModal()
      await loadApiKeys()
    }
  } catch (error) {
    showToast(editingApiKey.value ? 'API密钥更新失败' : 'API密钥创建失败', 'error')
    console.error('API密钥操作失败:', error)
  } finally {
    submitting.value = false
  }
}

const editApiKey = (apiKey: ApiKey) => {
  editingApiKey.value = apiKey
  formData.value = {
    name: apiKey.name,
    permissions: [...(apiKey.permissions || [])],
    databaseIds: [...apiKey.databaseIds],
    expiresAt: apiKey.expiresAt || ''
  }
  showCreateModal.value = true
}

const toggleApiKeyStatus = async (apiKey: ApiKey) => {
  try {
    await apiKeyApi.toggleApiKeyStatus(apiKey.id, !apiKey.isActive)
    showToast(`API密钥已${apiKey.isActive ? '禁用' : '启用'}`, 'success')
    await loadApiKeys()
  } catch (error) {
    showToast('操作失败', 'error')
    console.error('切换API密钥状态失败:', error)
  }
}

const deleteApiKey = async (apiKey: ApiKey) => {
  if (!confirm(`确定要删除API密钥 "${apiKey.name}" 吗？此操作不可恢复。`)) {
    return
  }

  try {
    await apiKeyApi.deleteApiKey(apiKey.id)
    showToast('API密钥删除成功', 'success')
    await loadApiKeys()
  } catch (error) {
    showToast('API密钥删除失败', 'error')
    console.error('删除API密钥失败:', error)
  }
}

const closeCreateModal = () => {
  showCreateModal.value = false
  editingApiKey.value = null
  formData.value = {
    name: '',
    permissions: [],
    databaseIds: [],
    expiresAt: ''
  }
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
  newApiKeySecret.value = ''
}

// 生命周期
onMounted(() => {
  loadApiKeys()
  loadDatabases()
  loadAvailablePermissions()
})
</script>
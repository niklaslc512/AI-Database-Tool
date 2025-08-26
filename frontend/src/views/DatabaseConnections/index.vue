<template>
  <div class="min-h-screen bg-base-100 p-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-base-content flex items-center gap-3">
          <div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          数据库连接管理
        </h1>
        <p class="text-base-content/70 mt-2">
          管理您的数据库连接配置，支持PostgreSQL和MongoDB数据库
        </p>
      </div>
      <button 
        @click="showCreateModal = true" 
        class="btn btn-primary gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        添加连接
      </button>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-base-content/70 text-sm font-medium">总连接数</p>
              <p class="text-2xl font-bold text-base-content">{{ connections.length }}</p>
            </div>
            <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-base-content/70 text-sm font-medium">在线连接</p>
              <p class="text-2xl font-bold text-success">{{ onlineConnectionsCount }}</p>
            </div>
            <div class="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-base-content/70 text-sm font-medium">离线连接</p>
              <p class="text-2xl font-bold text-error">{{ offlineConnectionsCount }}</p>
            </div>
            <div class="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-sm">
        <div class="card-body p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-base-content/70 text-sm font-medium">未测试</p>
              <p class="text-2xl font-bold text-warning">{{ untestedConnectionsCount }}</p>
            </div>
            <div class="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据库连接列表 -->
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body p-0">
        <!-- 表头 -->
        <div class="flex items-center justify-between p-6 border-b border-base-300">
          <h2 class="text-xl font-semibold text-base-content">数据库连接列表</h2>
          <div class="flex items-center gap-4">
            <!-- 搜索框 -->
            <div class="form-control">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="搜索连接名称..." 
                class="input input-bordered input-sm w-64"
              />
            </div>
            <!-- 筛选器 -->
            <select v-model="typeFilter" class="select select-bordered select-sm">
              <option value="">全部类型</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mongodb">MongoDB</option>
            </select>
            <select v-model="statusFilter" class="select select-bordered select-sm">
              <option value="">全部状态</option>
              <option value="connected">在线</option>
              <option value="disconnected">离线</option>
              <option value="untested">未测试</option>
            </select>
          </div>
        </div>

        <!-- 表格内容 -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>

        <div v-else-if="filteredConnections.length === 0" class="flex flex-col items-center justify-center py-12">
          <div class="w-16 h-16 bg-base-300 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-base-content mb-2">暂无数据库连接</h3>
          <p class="text-base-content/70 mb-4">创建您的第一个数据库连接来开始使用</p>
          <button @click="showCreateModal = true" class="btn btn-primary">
            添加数据库连接
          </button>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th class="font-semibold text-base-content">连接信息</th>
                <th class="font-semibold text-base-content">数据库类型</th>
                <th class="font-semibold text-base-content">连接状态</th>
                <th class="font-semibold text-base-content">最后测试</th>
                <th class="font-semibold text-base-content">创建时间</th>
                <th class="font-semibold text-base-content">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="connection in filteredConnections" :key="connection.id" class="hover">
                <!-- 连接信息 -->
                <td>
                  <div class="flex flex-col">
                    <div class="font-medium text-base-content">{{ connection.name }}</div>
                    <div class="text-sm text-base-content/70 mt-1">
                      {{ maskDsn(connection.dsn) }}
                    </div>
                  </div>
                </td>

                <!-- 数据库类型 -->
                <td>
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="getTypeIconClass(connection.type)">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <span class="font-medium">{{ getTypeLabel(connection.type) }}</span>
                  </div>
                </td>

                <!-- 连接状态 -->
                <td>
                  <div class="flex items-center gap-2">
                    <div class="badge" :class="getStatusBadgeClass(connection.status)">
                      {{ getStatusText(connection.status) }}
                    </div>
                    <div v-if="connection.testResult" class="tooltip" :data-tip="connection.testResult">
                      <svg class="w-4 h-4 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </td>

                <!-- 最后测试 -->
                <td>
                  <div class="text-sm">
                    <div v-if="connection.lastTestedAt">
                      {{ formatRelativeTime(connection.lastTestedAt) }}
                    </div>
                    <div v-else class="text-base-content/50">
                      从未测试
                    </div>
                  </div>
                </td>

                <!-- 创建时间 -->
                <td>
                  <div class="text-sm">
                    <div>{{ formatDate(connection.createdAt) }}</div>
                    <div class="text-base-content/70">{{ formatTime(connection.createdAt) }}</div>
                  </div>
                </td>

                <!-- 操作 -->
                <td>
                  <div class="flex items-center gap-2">
                    <button 
                      @click="testConnection(connection)" 
                      class="btn btn-ghost btn-sm"
                      title="测试连接"
                      :disabled="testingConnections.has(connection.id)"
                    >
                      <span v-if="testingConnections.has(connection.id)" class="loading loading-spinner loading-sm"></span>
                      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </button>
                    <button 
                      @click="editConnection(connection)" 
                      class="btn btn-ghost btn-sm"
                      title="编辑"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      @click="deleteConnection(connection)" 
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

    <!-- 创建/编辑数据库连接模态框 -->
    <div v-if="showCreateModal" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          {{ editingConnection ? '编辑数据库连接' : '创建数据库连接' }}
        </h3>
        
        <form @submit.prevent="submitConnection" class="space-y-4">
          <!-- 连接名称 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">连接名称 *</span>
            </label>
            <input 
              v-model="formData.name" 
              type="text" 
              placeholder="请输入连接名称" 
              class="input input-bordered w-full"
              required
            />
          </div>

          <!-- 数据库类型 -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">数据库类型 *</span>
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="label cursor-pointer justify-start gap-3 p-3 border border-base-300 rounded-lg hover:bg-base-200 transition-colors" :class="{ 'border-primary bg-primary/10': formData.type === 'postgresql' }">
                <input 
                  v-model="formData.type" 
                  value="postgresql" 
                  type="radio" 
                  class="radio radio-primary"
                  required
                />
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <div class="label-text font-medium">PostgreSQL</div>
                    <div class="text-xs text-base-content/70">关系型数据库</div>
                  </div>
                </div>
              </label>
              <label class="label cursor-pointer justify-start gap-3 p-3 border border-base-300 rounded-lg hover:bg-base-200 transition-colors" :class="{ 'border-primary bg-primary/10': formData.type === 'mongodb' }">
                <input 
                  v-model="formData.type" 
                  value="mongodb" 
                  type="radio" 
                  class="radio radio-primary"
                  required
                />
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  </div>
                  <div>
                    <div class="label-text font-medium">MongoDB</div>
                    <div class="text-xs text-base-content/70">文档型数据库</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- DSN连接字符串 -->
          <div class="form-control">
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="label-text font-medium">DSN连接字符串 *</span>
                <span class="label-text-alt text-info cursor-pointer hover:text-info-focus transition-colors" @click="showDsnHelp = !showDsnHelp">
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  格式说明
                </span>
              </div>
              <textarea 
                v-model="formData.dsn" 
                placeholder="请输入DSN连接字符串" 
                class="textarea textarea-bordered h-24 font-mono text-sm w-full"
                required
              ></textarea>
            </div>
            
            <!-- DSN格式说明 -->
            <div v-if="showDsnHelp" class="mt-3 p-4 bg-base-200 rounded-lg border border-base-300">
              <div class="flex items-center gap-2 mb-3">
                <svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h4 class="font-medium text-base-content">DSN格式说明</h4>
              </div>
              <div class="space-y-3">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">P</div>
                    <strong class="text-base-content">PostgreSQL:</strong>
                  </div>
                  <code class="block p-3 bg-base-100 rounded border text-sm font-mono">
                    postgresql://username:password@host:port/database?sslmode=require
                  </code>
                  <div class="text-xs text-base-content/70 mt-1">示例: postgresql://user:pass@localhost:5432/mydb</div>
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <div class="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">M</div>
                    <strong class="text-base-content">MongoDB:</strong>
                  </div>
                  <code class="block p-3 bg-base-100 rounded border text-sm font-mono">
                    mongodb://username:password@host:port/database?authSource=admin
                  </code>
                  <div class="text-xs text-base-content/70 mt-1">示例: mongodb://user:pass@localhost:27017/mydb</div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" @click="closeCreateModal" class="btn btn-ghost">
              取消
            </button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
              {{ editingConnection ? '更新' : '创建' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DatabaseConnection } from '@/types'
import { useToast } from '@/composables/useToast'
import { connectionApi } from '@/utils/api'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateModal = ref(false)
const showDsnHelp = ref(false)
const editingConnection = ref<DatabaseConnection | null>(null)
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const testingConnections = ref(new Set<string>())

// 数据库连接列表
const connections = ref<DatabaseConnection[]>([])

// 表单数据
const formData = ref({
  name: '',
  type: '',
  dsn: ''
})

// Toast 通知
const { showToast } = useToast()

// 计算属性
const onlineConnectionsCount = computed(() => 
  connections.value.filter(conn => conn.status === 'connected').length
)

const offlineConnectionsCount = computed(() => 
  connections.value.filter(conn => conn.status === 'disconnected').length
)

const untestedConnectionsCount = computed(() => 
  connections.value.filter(conn => conn.status === 'untested').length
)

const filteredConnections = computed(() => {
  let filtered = connections.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(conn => 
      conn.name.toLowerCase().includes(query) ||
      conn.dsn.toLowerCase().includes(query)
    )
  }

  // 类型过滤
  if (typeFilter.value) {
    filtered = filtered.filter(conn => conn.type === typeFilter.value)
  }

  // 状态过滤
  if (statusFilter.value) {
    filtered = filtered.filter(conn => conn.status === statusFilter.value)
  }

  return filtered
})

// 工具函数
const maskDsn = (dsn: string) => {
  // 隐藏DSN中的敏感信息（用户名和密码）
  return dsn.replace(/:([^:@]+)@/, ':***@')
}

const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    postgresql: 'PostgreSQL',
    mongodb: 'MongoDB'
  }
  return typeMap[type] || type
}

const getTypeIconClass = (type: string) => {
  const classMap: Record<string, string> = {
    postgresql: 'bg-blue-100 text-blue-600',
    mongodb: 'bg-green-100 text-green-600'
  }
  return classMap[type] || 'bg-gray-100 text-gray-600'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    connected: '在线',
    disconnected: '离线',
    untested: '未测试'
  }
  return statusMap[status] || status
}

const getStatusBadgeClass = (status: string) => {
  const classMap: Record<string, string> = {
    connected: 'badge-success',
    disconnected: 'badge-error',
    untested: 'badge-warning'
  }
  return classMap[status] || 'badge-ghost'
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

// API操作
const loadConnections = async () => {
  loading.value = true
  try {
    connections.value = await connectionApi.getConnections()
  } catch (error) {
    showToast('加载数据库连接失败', 'error')
    console.error('加载数据库连接失败:', error)
  } finally {
    loading.value = false
  }
}

const submitConnection = async () => {
  submitting.value = true
  try {
    if (editingConnection.value) {
      // 更新数据库连接
      await connectionApi.updateConnection(editingConnection.value.id, formData.value)
      showToast('数据库连接更新成功', 'success')
    } else {
      // 创建数据库连接
      await connectionApi.createConnection(formData.value)
      showToast('数据库连接创建成功', 'success')
    }
    closeCreateModal()
    await loadConnections()
  } catch (error) {
    showToast(editingConnection.value ? '数据库连接更新失败' : '数据库连接创建失败', 'error')
    console.error('数据库连接操作失败:', error)
  } finally {
    submitting.value = false
  }
}

const editConnection = (connection: DatabaseConnection) => {
  editingConnection.value = connection
  formData.value = {
    name: connection.name,
    type: connection.type,
    dsn: connection.dsn
  }
  showCreateModal.value = true
}

const testConnection = async (connection: DatabaseConnection) => {
  testingConnections.value.add(connection.id)
  try {
    await connectionApi.testConnection({ id: connection.id })
    showToast('连接测试成功', 'success')
    await loadConnections()
  } catch (error) {
    showToast('连接测试失败', 'error')
    console.error('连接测试失败:', error)
  } finally {
    testingConnections.value.delete(connection.id)
  }
}

const deleteConnection = async (connection: DatabaseConnection) => {
  if (!confirm(`确定要删除数据库连接 "${connection.name}" 吗？此操作不可恢复。`)) {
    return
  }

  try {
    await connectionApi.deleteConnection(connection.id)
    showToast('数据库连接删除成功', 'success')
    await loadConnections()
  } catch (error) {
    showToast('数据库连接删除失败', 'error')
    console.error('删除数据库连接失败:', error)
  }
}

const closeCreateModal = () => {
  showCreateModal.value = false
  showDsnHelp.value = false
  editingConnection.value = null
  formData.value = {
    name: '',
    type: '',
    dsn: ''
  }
}

// 生命周期
onMounted(() => {
  loadConnections()
})
</script>
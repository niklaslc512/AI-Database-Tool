<template>
  <div class=" flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 overflow-hidden">
    <!-- 📊 页面头部 -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-gray-200 flex-shrink-0 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1
            class="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Setting class="w-6 h-6 text-green-600" />
            </div>
            系统设置
          </h1>
          <p class="text-gray-600 mt-2">管理系统配置、安全设置和全局参数</p>
        </div>
        <button
          class="btn bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          @click="handleAddConfig">
          <Plus class="w-4 h-4 mr-2" />
          添加配置
        </button>
      </div>
    </div>

    <!-- 🔍 搜索和筛选区域 -->
    <div class="bg-white/70 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
      <div class="flex flex-col lg:flex-row gap-4">
        <div class="flex-1">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input v-model="searchKeyword" type="text" placeholder="搜索配置项..."
              class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              @input="handleSearch" />
          </div>
        </div>
        <div class="flex gap-4">
          <select v-model="selectedCategory"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            @change="handleCategoryChange">
            <option value="">所有分类</option>
            <option value="user">用户配置</option>
            <option value="system">系统配置</option>
            <option value="global">全局配置</option>
          </select>
          <select v-model="selectedType"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            @change="handleTypeChange">
            <option value="">所有类型</option>
            <option value="string">字符串</option>
            <option value="number">数字</option>
            <option value="boolean">布尔值</option>
            <option value="json">JSON</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 📋 主要内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden min-h-0">
      <div
        class="bg-white/70 backdrop-blur-sm flex flex-col shadow-lg overflow-hidden min-h-0 rounded-xl border border-white/20 mx-6 mb-6">
        <!-- 表格内容 -->
        <div class="flex-1 overflow-y-auto min-h-0 p-6">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 sticky top-0">
                <tr class="text-gray-700">
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配置键</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配置值</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">加密</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="loading">
                  <td colspan="7" class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <span class="text-gray-600">正在加载配置数据...</span>
                  </td>
                </tr>
                <tr v-else-if="configs.length === 0">
                  <td colspan="7" class="text-center py-8 text-gray-500">
                    暂无配置数据
                  </td>
                </tr>
                <tr v-else v-for="config in configs" :key="config.id"
                  class="hover:bg-gray-50 transition-colors duration-200">
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="badge badge-primary">
                        {{ config.config_type }}
                      </span>
                      <span class="font-mono text-sm">{{ config.config_key }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="max-w-xs">
                      <span v-if="config.config_type === 'boolean'"
                        :class="`badge ${config.config_value === 'true' ? 'badge-success' : 'badge-error'}`">
                        {{ config.config_value === 'true' ? '是' : '否' }}
                      </span>
                      <span v-else-if="config.config_type === 'json'" class="badge badge-info">
                        JSON 对象
                      </span>
                      <span v-else class="text-sm truncate">{{ config.config_value }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-outline">{{ config.config_type }}</span>
                  </td>
                  <td>
                    <span :class="`badge ${config.is_encrypted ? 'badge-warning' : 'badge-success'}`">
                      {{ config.is_encrypted ? '是' : '否' }}
                    </span>
                  </td>
                  <td>
                    <span class="text-sm text-gray-600 truncate max-w-xs block">{{ config.description || '-' }}</span>
                  </td>
                  <td>
                    <span class="text-sm text-gray-600">{{ formatDate(config.updated_at) }}</span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button class="btn btn-sm btn-outline btn-primary" @click="handleEditConfig(config)">
                        编辑
                      </button>
                      <button class="btn btn-sm btn-outline btn-error" @click="handleDeleteConfig(config)">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 📄 分页 -->
          <div class="card-body py-4">
            <div class="flex flex-col lg:flex-row justify-between items-center gap-6">
              <!-- 分页按钮 -->
              <div class="join flex-shrink-0">
                <button class="join-item btn btn-sm border-green-300 hover:bg-green-50" :disabled="currentPage <= 1"
                  @click="currentPage = Math.max(1, currentPage - 1)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button class="join-item btn btn-sm bg-green-100 border-green-300 text-green-800 min-w-[100px]">
                  第 {{ currentPage }} 页
                </button>
                <button class="join-item btn btn-sm border-green-300 hover:bg-green-50"
                  :disabled="currentPage >= totalPages" @click="currentPage = Math.min(totalPages, currentPage + 1)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>

              <!-- 分页信息 -->
              <div class="flex items-center gap-4 text-sm text-gray-600 flex-wrap justify-center lg:justify-end">
                <div class="flex items-center gap-2">
                  <span class="whitespace-nowrap">每页</span>
                  <select v-model="pageSize"
                    class="select select-bordered select-sm border-green-300 focus:border-green-500 min-w-[70px]"
                    @change="handleSizeChange">
                    <option :value="10">10</option>
                    <option :value="20">20</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                  <span class="whitespace-nowrap">条</span>
                </div>
                <div class="divider divider-horizontal mx-2"></div>
                <span class="font-medium text-green-700 whitespace-nowrap">共 {{ totalConfigs }} 条记录</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 🔧 添加/编辑配置对话框 -->
      <div v-if="dialogVisible" class="modal modal-open">
        <div class="modal-box w-11/12 max-w-2xl">
          <h3 class="font-bold text-lg mb-4">{{ isEditing ? '编辑配置' : '添加配置' }}</h3>

          <form @submit.prevent="handleSaveConfig" class="space-y-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">配置键 *</span>
              </label>
              <input v-model="configForm.config_key" type="text" placeholder="请输入配置键"
                class="input input-bordered w-full" :disabled="isEditing" required />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">配置值 *</span>
              </label>
              <input v-model="configForm.config_value" type="text" placeholder="请输入配置值"
                class="input input-bordered w-full" required />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">配置类型 *</span>
              </label>
              <select v-model="configForm.config_type" class="select select-bordered w-full" required>
                <option value="user">用户配置</option>
                <option value="system">系统配置</option>
                <option value="global">全局配置</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">是否加密</span>
              </label>
              <div class="flex items-center gap-4">
                <label class="cursor-pointer label">
                  <input type="radio" :value="false" v-model="configForm.is_encrypted" class="radio radio-primary" />
                  <span class="label-text ml-2">否</span>
                </label>
                <label class="cursor-pointer label">
                  <input type="radio" :value="true" v-model="configForm.is_encrypted" class="radio radio-primary" />
                  <span class="label-text ml-2">是</span>
                </label>
              </div>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">描述</span>
              </label>
              <textarea v-model="configForm.description" placeholder="请输入配置描述" class="textarea textarea-bordered w-full"
                rows="2"></textarea>
            </div>
          </form>

          <div class="modal-action">
            <button class="btn btn-ghost" @click="handleDialogClose">取消</button>
            <button class="btn btn-primary" @click="handleSaveConfig" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-sm"></span>
              {{ saving ? (isEditing ? '更新中...' : '创建中...') : (isEditing ? '更新' : '创建') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Setting,
  Plus,
  Search
} from '@/utils/iconMapping'
import { configApi } from '@/utils/api'
import type {
  SystemConfig,
  CreateConfigRequest,
  UpdateConfigRequest
} from '@/types'

// 🔔 原生消息提示函数
const showMessage = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  const toast = document.createElement('div')
  toast.className = `toast toast-top toast-end z-50`

  const alertClass = type === 'success' ? 'alert-success' :
    type === 'error' ? 'alert-error' : 'alert-warning'

  toast.innerHTML = `
    <div class="alert ${alertClass}">
      <span>${message}</span>
    </div>
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  }, 3000)
}

// 🔔 原生确认对话框函数
const showConfirm = (message: string, title: string = '确认'): Promise<boolean> => {
  return new Promise((resolve) => {
    const modal = document.createElement('div')
    modal.className = 'modal modal-open'
    modal.innerHTML = `
      <div class="modal-box">
        <h3 class="font-bold text-lg">${title}</h3>
        <p class="py-4">${message}</p>
        <div class="modal-action">
          <button class="btn btn-ghost" data-action="cancel">取消</button>
          <button class="btn btn-primary" data-action="confirm">确定</button>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      const action = target.getAttribute('data-action')

      if (action === 'confirm') {
        resolve(true)
      } else if (action === 'cancel') {
        resolve(false)
      }

      if (action) {
        document.body.removeChild(modal)
      }
    })
  })
}

// 🔧 响应式数据
const loading = ref(false)
const saving = ref(false)
const configs = ref<SystemConfig[]>([])

// 🔍 搜索和筛选
const searchKeyword = ref('')
const selectedCategory = ref('')
const selectedType = ref('')

// 📄 分页
const currentPage = ref(1)
const pageSize = ref(20)
const totalConfigs = ref(0)

// 📊 计算属性 - 总页数
const totalPages = computed(() => Math.ceil(totalConfigs.value / pageSize.value))

// 🔧 对话框
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingConfig = ref<SystemConfig | null>(null)

// 📝 表单数据
const configForm = reactive<CreateConfigRequest>({
  config_key: '',
  config_value: '',
  config_type: 'user',
  description: '',
  is_encrypted: false
})



// 🎨 样式辅助函数
const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 📋 数据加载
const loadConfigs = async () => {
  try {
    loading.value = true
    const response = await configApi.getConfigs({
      page: currentPage.value,
      limit: pageSize.value,
      category: selectedCategory.value || undefined,
      search: searchKeyword.value || undefined,
      includeValues: true
    })
    configs.value = response.data
    totalConfigs.value = response.pagination.total
  } catch (error) {
    console.error('❌ 加载配置失败:', error)
    showMessage('加载配置失败', 'error')
  } finally {
    loading.value = false
  }
}

// 🔍 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadConfigs()
}

const handleCategoryChange = () => {
  currentPage.value = 1
  loadConfigs()
}

const handleTypeChange = () => {
  currentPage.value = 1
}

const handleSizeChange = () => {
  currentPage.value = 1
  loadConfigs()
}

// 🔧 配置操作
const handleAddConfig = () => {
  isEditing.value = false
  editingConfig.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEditConfig = (config: SystemConfig) => {
  isEditing.value = true
  editingConfig.value = config
  configForm.config_key = config.config_key
  configForm.config_value = config.config_value || ''
  configForm.config_type = config.config_type
  configForm.description = config.description || ''
  configForm.is_encrypted = config.is_encrypted
  dialogVisible.value = true
}
// 🗑️ 删除配置
const handleDeleteConfig = async (config: SystemConfig) => {
  const confirmed = await showConfirm(
    `确定要删除配置 "${config.config_key}" 吗？此操作不可撤销。`,
    '删除配置'
  )

  if (!confirmed) return

  try {
    await configApi.deleteConfig(config.id)
    showMessage('配置删除成功')
    loadConfigs()
  } catch (error) {
    console.error('❌ 删除配置失败:', error)
    showMessage('删除配置失败', 'error')
  }
}

const handleSaveConfig = async () => {
  try {
    saving.value = true

    if (isEditing.value && editingConfig.value) {
      const updateData: UpdateConfigRequest = {
        config_value: configForm.config_value,
        description: configForm.description,
        is_encrypted: configForm.is_encrypted
      }
      await configApi.updateConfig(editingConfig.value.id, updateData)
      showMessage('配置更新成功')
    } else {
      await configApi.createConfig(configForm)
      showMessage('配置创建成功')
    }

    dialogVisible.value = false
    loadConfigs()
  } catch (error) {
    console.error('❌ 保存配置失败:', error)
    showMessage('保存配置失败', 'error')
  } finally {
    saving.value = false
  }
}

const handleDialogClose = () => {
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  configForm.config_key = ''
  configForm.config_value = ''
  configForm.config_type = 'user'
  configForm.description = ''
  configForm.is_encrypted = false
}

// 👀 监听页面变化
watch(currentPage, () => {
  loadConfigs()
})

// 🚀 初始化
onMounted(() => {
  loadConfigs()
})
</script>
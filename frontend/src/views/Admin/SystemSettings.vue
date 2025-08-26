<template>
  <div class="space-y-8">
    <!-- 📊 页面头部 -->
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Setting class="w-6 h-6" />
            系统设置
          </h1>
          <p class="text-lg text-gray-600 mt-2">管理系统配置、安全设置和全局参数</p>
        </div>
        <div>
          <button 
            class="btn btn-primary bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
            @click="handleAddConfig"
          >
            <Plus class="w-4 h-4 mr-2" />
            添加配置
          </button>
        </div>
      </div>
    </div>

    <!-- 🔍 搜索和筛选 -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex flex-col lg:flex-row gap-4">
          <div class="flex-1">
            <div class="form-control">
              <label class="input input-bordered flex items-center gap-2 border-green-300 focus-within:border-green-500">
                <Search class="w-4 h-4 text-green-600" />
                <input
                  v-model="searchKeyword"
                  type="text"
                  placeholder="搜索配置项..."
                  class="grow"
                  @input="handleSearch"
                />
              </label>
            </div>
          </div>
          <div class="flex gap-4">
            <select
              v-model="selectedCategory"
              class="select select-bordered border-green-300 focus:border-green-500"
              @change="handleCategoryChange"
            >
              <option value="">所有分类</option>
              <option
                v-for="(info, category) in CONFIG_CATEGORIES"
                :key="category"
                :value="category"
              >
                {{ info.name }}
              </option>
            </select>
            <select
              v-model="selectedType"
              class="select select-bordered border-green-300 focus:border-green-500"
              @change="handleTypeChange"
            >
              <option value="">所有类型</option>
              <option
                v-for="(info, type) in CONFIG_TYPES"
                :key="type"
                :value="type"
              >
                {{ info.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- 📋 配置列表 -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead class="bg-green-50">
              <tr>
                <th class="text-green-800">配置键</th>
                <th class="text-green-800">配置值</th>
                <th class="text-green-800">分类</th>
                <th class="text-green-800">描述</th>
                <th class="text-green-800">更新时间</th>
                <th class="text-green-800">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-8">
                  <span class="loading loading-spinner loading-md text-green-600"></span>
                  <span class="ml-2">正在加载配置数据...</span>
                </td>
              </tr>
              <tr v-else-if="filteredConfigs.length === 0">
                <td colspan="6" class="text-center py-8 text-gray-500">
                  暂无配置数据
                </td>
              </tr>
              <tr v-else v-for="config in filteredConfigs" :key="config.id" class="hover">
                <td>
                  <div class="flex items-center gap-2">
                    <span :class="`badge ${getTypeColor(config.type)}`">
                      {{ getTypeLabel(config.type) }}
                    </span>
                    <span class="font-mono text-sm">{{ config.key }}</span>
                  </div>
                </td>
                <td>
                  <div class="max-w-xs">
                    <span v-if="config.type === 'boolean'" :class="`badge ${config.value === 'true' ? 'badge-success' : 'badge-error'}`">
                      {{ config.value === 'true' ? '是' : '否' }}
                    </span>
                    <span v-else-if="config.type === 'json'" class="badge badge-info">
                      JSON 对象
                    </span>
                    <span v-else class="text-sm truncate">{{ config.value }}</span>
                  </div>
                </td>
                <td>
                  <span :class="`badge ${getCategoryColor(config.category)}`">
                    {{ getCategoryName(config.category) }}
                  </span>
                </td>
                <td>
                  <span class="text-sm text-gray-600 truncate max-w-xs block">{{ config.description || '-' }}</span>
                </td>
                <td>
                  <span class="text-sm text-gray-600">{{ formatDate(config.updatedAt) }}</span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button
                      class="btn btn-sm btn-outline btn-primary"
                      @click="handleEditConfig(config)"
                    >
                      编辑
                    </button>
                    <button
                      class="btn btn-sm btn-outline btn-error"
                      @click="handleDeleteConfig(config)"
                    >
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
              <button 
                class="join-item btn btn-sm border-green-300 hover:bg-green-50"
                :disabled="currentPage <= 1"
                @click="currentPage = Math.max(1, currentPage - 1)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <button class="join-item btn btn-sm bg-green-100 border-green-300 text-green-800 min-w-[100px]">
                第 {{ currentPage }} 页
              </button>
              <button 
                class="join-item btn btn-sm border-green-300 hover:bg-green-50"
                :disabled="currentPage >= totalPages"
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
            
            <!-- 分页信息 -->
            <div class="flex items-center gap-4 text-sm text-gray-600 flex-wrap justify-center lg:justify-end">
              <div class="flex items-center gap-2">
                <span class="whitespace-nowrap">每页</span>
                <select 
                  v-model="pageSize" 
                  class="select select-bordered select-sm border-green-300 focus:border-green-500 min-w-[70px]"
                  @change="handleSizeChange"
                >
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
            <input 
              v-model="configForm.key" 
              type="text" 
              placeholder="请输入配置键" 
              class="input input-bordered w-full" 
              :disabled="isEditing"
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">配置值 *</span>
            </label>
            <input 
              v-if="configForm.type !== 'boolean' && configForm.type !== 'json'"
              v-model="configForm.value" 
              type="text" 
              placeholder="请输入配置值" 
              class="input input-bordered w-full" 
              required
            />
            <div v-else-if="configForm.type === 'boolean'" class="flex items-center gap-4">
              <label class="cursor-pointer label">
                <input 
                  type="radio" 
                  :value="'true'" 
                  v-model="configForm.value" 
                  class="radio radio-primary" 
                />
                <span class="label-text ml-2">是</span>
              </label>
              <label class="cursor-pointer label">
                <input 
                  type="radio" 
                  :value="'false'" 
                  v-model="configForm.value" 
                  class="radio radio-primary" 
                />
                <span class="label-text ml-2">否</span>
              </label>
            </div>
            <textarea 
              v-else
              v-model="configForm.value" 
              placeholder="请输入JSON格式的配置值" 
              class="textarea textarea-bordered w-full" 
              rows="4"
              required
            ></textarea>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">类型 *</span>
            </label>
            <select v-model="configForm.type" class="select select-bordered w-full" required>
              <option
                v-for="(info, type) in CONFIG_TYPES"
                :key="type"
                :value="type"
              >
                {{ info.name }}
              </option>
            </select>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">分类 *</span>
            </label>
            <select v-model="configForm.category" class="select select-bordered w-full" required>
              <option
                v-for="(info, category) in CONFIG_CATEGORIES"
                :key="category"
                :value="category"
              >
                {{ info.name }}
              </option>
            </select>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">描述</span>
            </label>
            <textarea 
              v-model="configForm.description" 
              placeholder="请输入配置描述" 
              class="textarea textarea-bordered w-full" 
              rows="2"
            ></textarea>
          </div>
        </form>
        
        <div class="modal-action">
          <button class="btn btn-ghost" @click="handleDialogClose">取消</button>
          <button 
            class="btn btn-primary" 
            @click="handleSaveConfig" 
            :disabled="saving"
          >
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            {{ saving ? (isEditing ? '更新中...' : '创建中...') : (isEditing ? '更新' : '创建') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { 
  Setting, 
  Plus, 
  Search
} from '@/utils/iconMapping'
import { configApi } from '@/utils/api'
import type { 
  SystemConfig, 
  CreateConfigRequest, 
  UpdateConfigRequest,
  ConfigType,
  ConfigCategory
} from '@/types'
import { CONFIG_CATEGORIES, CONFIG_TYPES } from '@/types'

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
  key: '',
  value: '',
  type: 'string',
  category: 'general',
  description: ''
})

// 🔍 计算属性 - 过滤后的配置列表
const filteredConfigs = computed(() => {
  let result = configs.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(config => 
      config.key.toLowerCase().includes(keyword) ||
      config.value.toLowerCase().includes(keyword) ||
      config.description?.toLowerCase().includes(keyword)
    )
  }
  
  // 分类过滤
  if (selectedCategory.value) {
    result = result.filter(config => config.category === selectedCategory.value)
  }
  
  // 类型过滤
  if (selectedType.value) {
    result = result.filter(config => config.type === selectedType.value)
  }
  
  return result
})

// 🎨 样式辅助函数
const getTypeColor = (type: ConfigType): string => {
  const colors = {
    string: 'badge-primary',
    number: 'badge-success',
    boolean: 'badge-warning',
    json: 'badge-info'
  }
  return colors[type] || 'badge-ghost'
}

const getTypeLabel = (type: ConfigType): string => {
  return CONFIG_TYPES[type]?.name || type
}

const getCategoryColor = (category: ConfigCategory): string => {
  const colors = {
    general: 'badge-neutral',
    database: 'badge-primary',
    ai: 'badge-secondary',
    security: 'badge-warning',
    system: 'badge-info'
  }
  return colors[category] || 'badge-ghost'
}

const getCategoryName = (category: ConfigCategory): string => {
  return CONFIG_CATEGORIES[category]?.name || category
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 📋 数据加载
const loadConfigs = async () => {
  try {
    loading.value = true
    const response = await configApi.getConfigs({
      page: currentPage.value,
      limit: pageSize.value
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
}

const handleCategoryChange = () => {
  currentPage.value = 1
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
  configForm.key = config.key
  configForm.value = config.value
  configForm.type = config.type
  configForm.category = config.category
  configForm.description = config.description || ''
  dialogVisible.value = true
}

const handleDeleteConfig = async (config: SystemConfig) => {
  const confirmed = await showConfirm(
    `确定要删除配置 "${config.key}" 吗？此操作不可撤销。`,
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
        value: configForm.value,
        description: configForm.description,
        category: configForm.category
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
  configForm.key = ''
  configForm.value = ''
  configForm.type = 'string'
  configForm.category = 'general'
  configForm.description = ''
}

// 🚀 初始化
onMounted(() => {
  loadConfigs()
})
</script>
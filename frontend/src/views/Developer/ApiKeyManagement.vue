<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">🔑 API密钥管理</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          管理和配置API密钥，用于第三方服务集成
        </p>
      </div>
      <el-button type="primary" @click="handleCreateApiKey">
        <el-icon class="mr-2"><Plus /></el-icon>
        创建密钥
      </el-button>
    </div>

    <!-- API密钥列表 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">API密钥列表</h2>
      </div>
      
      <div class="p-6">
        <el-table 
          :data="apiKeys" 
          v-loading="loading"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="name" label="密钥名称" width="200">
            <template #default="{ row }">
              <div class="flex items-center">
                <el-icon class="mr-2 text-blue-500"><Key /></el-icon>
                <span class="font-medium">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="service" label="服务类型" width="150">
            <template #default="{ row }">
              <el-tag :type="getServiceTagType(row.service)">{{ row.service }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="key" label="密钥" min-width="300">
            <template #default="{ row }">
              <div class="flex items-center space-x-2">
                <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                  {{ row.masked ? maskApiKey(row.key) : row.key }}
                </code>
                <el-button 
                  size="small" 
                  text 
                  @click="toggleKeyVisibility(row)"
                >
                  <el-icon>
                    <View v-if="row.masked" />
                    <Hide v-else />
                  </el-icon>
                </el-button>
                <el-button 
                  size="small" 
                  text 
                  @click="copyToClipboard(row.key)"
                >
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button 
                size="small" 
                text 
                type="primary" 
                @click="handleEditApiKey(row)"
              >
                编辑
              </el-button>
              <el-button 
                size="small" 
                text 
                type="danger" 
                @click="handleDeleteApiKey(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 创建/编辑API密钥对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="editingApiKey ? '编辑API密钥' : '创建API密钥'"
      width="500px"
    >
      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item label="密钥名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入密钥名称" />
        </el-form-item>
        
        <el-form-item label="服务类型" prop="service">
          <el-select v-model="formData.service" placeholder="请选择服务类型" style="width: 100%">
            <el-option label="OpenAI" value="openai" />
            <el-option label="Claude" value="claude" />
            <el-option label="Google AI" value="google" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="API密钥" prop="key">
          <el-input 
            v-model="formData.key" 
            type="password" 
            placeholder="请输入API密钥" 
            show-password
          />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            placeholder="请输入密钥描述（可选）" 
            :rows="3"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ editingApiKey ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
// 🎨 使用原生浏览器API替代Element Plus消息组件
// import type { FormInstance, FormRules } from 'element-plus'
import {
  Plus,
  Key,
  View,
  Hide,
  CopyDocument
} from '@/utils/iconMapping'

// 🔑 API密钥接口定义
interface ApiKey {
  id: string
  name: string
  service: string
  key: string
  description?: string
  status: 'active' | 'inactive'
  masked: boolean
  createdAt: string
  updatedAt: string
}

// 📊 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const editingApiKey = ref<ApiKey | null>(null)
const formRef = ref<FormInstance>()

// 📋 API密钥列表
const apiKeys = ref<ApiKey[]>([
  {
    id: '1',
    name: 'OpenAI GPT-4',
    service: 'openai',
    key: 'sk-1234567890abcdef1234567890abcdef',
    description: '用于AI查询功能的OpenAI API密钥',
    status: 'active',
    masked: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Claude API',
    service: 'claude',
    key: 'sk-ant-api03-abcdef1234567890',
    description: 'Anthropic Claude API密钥',
    status: 'active',
    masked: true,
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-10T14:20:00Z'
  }
])

// 📝 表单数据
const formData = reactive({
  name: '',
  service: '',
  key: '',
  description: ''
})

// 📋 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入密钥名称', trigger: 'blur' }
  ],
  service: [
    { required: true, message: '请选择服务类型', trigger: 'change' }
  ],
  key: [
    { required: true, message: '请输入API密钥', trigger: 'blur' }
  ]
}

// 🎨 工具函数
const getServiceTagType = (service: string) => {
  const typeMap: Record<string, string> = {
    openai: 'success',
    claude: 'warning',
    google: 'info',
    other: 'default'
  }
  return typeMap[service] || 'default'
}

const maskApiKey = (key: string) => {
  if (key.length <= 8) return key
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 🔧 操作函数
const toggleKeyVisibility = (apiKey: ApiKey) => {
  apiKey.masked = !apiKey.masked
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('✅ 已复制到剪贴板')
  } catch (error) {
    ElMessage.error('❌ 复制失败')
  }
}

const handleCreateApiKey = () => {
  editingApiKey.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEditApiKey = (apiKey: ApiKey) => {
  editingApiKey.value = apiKey
  formData.name = apiKey.name
  formData.service = apiKey.service
  formData.key = apiKey.key
  formData.description = apiKey.description || ''
  dialogVisible.value = true
}

const handleDeleteApiKey = async (apiKey: ApiKey) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除API密钥 "${apiKey.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟删除操作
    const index = apiKeys.value.findIndex(item => item.id === apiKey.id)
    if (index > -1) {
      apiKeys.value.splice(index, 1)
      ElMessage.success('✅ API密钥删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (editingApiKey.value) {
      // 更新现有密钥
      const index = apiKeys.value.findIndex(item => item.id === editingApiKey.value!.id)
      if (index > -1) {
        apiKeys.value[index] = {
          ...apiKeys.value[index],
          name: formData.name,
          service: formData.service,
          key: formData.key,
          description: formData.description,
          updatedAt: new Date().toISOString()
        }
      }
      ElMessage.success('✅ API密钥更新成功')
    } else {
      // 创建新密钥
      const newApiKey: ApiKey = {
        id: Date.now().toString(),
        name: formData.name,
        service: formData.service,
        key: formData.key,
        description: formData.description,
        status: 'active',
        masked: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      apiKeys.value.unshift(newApiKey)
      ElMessage.success('✅ API密钥创建成功')
    }
    
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    console.error('❌ 提交失败:', error)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formData.name = ''
  formData.service = ''
  formData.key = ''
  formData.description = ''
  formRef.value?.clearValidate()
}

const loadApiKeys = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('🔑 API密钥列表加载完成')
  } catch (error) {
    console.error('❌ 加载API密钥失败:', error)
    ElMessage.error('❌ 加载API密钥失败')
  } finally {
    loading.value = false
  }
}

// 🚀 生命周期
onMounted(() => {
  loadApiKeys()
})
</script>

<style scoped>
/* 移除了theme函数调用，使用标准CSS颜色值 */
.el-table {
  --el-table-border-color: #e5e7eb;
}

.dark .el-table {
  --el-table-border-color: #374151;
}
</style>
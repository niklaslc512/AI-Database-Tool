<template>
  <div class=" flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 overflow-hidden">
    <!-- 📊 页面头部 -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-gray-200 flex-shrink-0 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <User class="w-6 h-6 text-green-600" />
            </div>
            用户管理
          </h1>
          <p class="text-gray-600 mt-2">管理系统用户账户、角色权限和访问控制</p>
        </div>
        <button 
          class="btn bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          @click="showCreateDialog = true"
          v-permission="{ permission: 'user:create' }"
        >
          <Plus class="w-4 h-4 mr-2" />
          新建用户
        </button>
      </div>
    </div>

    <!-- 🔍 搜索和筛选区域 -->
    <div class="bg-white/70 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div class="md:col-span-2">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchForm.keyword"
              type="text"
              placeholder="搜索用户名或邮箱"
              class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              @input="handleSearch"
            />
          </div>
        </div>
        <div>
          <select
            v-model="searchForm.role"
            class="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            @change="handleSearch"
          >
            <option value="">角色筛选</option>
            <option value="admin">管理员</option>
            <option value="developer">开发者</option>
            <option value="guest">访客</option>
          </select>
        </div>
        <div>
          <select
            v-model="searchForm.status"
            class="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
            @change="handleSearch"
          >
            <option value="">状态筛选</option>
            <option value="active">活跃</option>
            <option value="inactive">非活跃</option>
            <option value="locked">锁定</option>
          </select>
        </div>
        <div class="md:col-span-2 flex gap-2">
          <button class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200" @click="resetSearch">重置</button>
          <button class="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200" @click="handleSearch">搜索</button>
        </div>
      </div>
    </div>

    <!-- 📋 主要内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden min-h-0">
      <div class="bg-white/70 backdrop-blur-sm flex flex-col shadow-lg overflow-hidden min-h-0">
        <!-- 表格内容 -->
        <div class="flex-1 overflow-y-auto min-h-0 p-6">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 sticky top-0">
                <tr class="text-gray-700">
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="loading">
                  <td colspan="8" class="text-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <span class="text-gray-600">正在加载用户数据...</span>
                  </td>
                </tr>
                <tr v-else-if="userList.length === 0">
                  <td colspan="8" class="text-center py-8 text-gray-500">
                    暂无用户数据
                  </td>
                </tr>
                <tr v-else v-for="user in userList" :key="user.id" class="hover:bg-gray-50 transition-colors duration-200">
                   <td class="font-mono text-green-700 font-semibold">#{{ user.id }}</td>
                  <td>
                    <div class="flex items-center space-x-3">
                      <div class="avatar">
                        <div class="mask mask-squircle w-12 h-12">
                          <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.username" />
                          <div v-else class="bg-green-100 text-green-600 w-12 h-12 flex items-center justify-center rounded-full">
                             <User class="w-6 h-6" />
                           </div>
                        </div>
                      </div>
                      <div>
                        <div class="font-bold text-gray-900">{{ user.username || '未知用户' }}</div>
                        <div class="text-sm opacity-50">{{ user.displayName || '未设置' }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <div
                        v-for="role in parseRoles(user.roles || '')"
                        :key="role"
                        :class="[
                          'badge badge-sm',
                          role === 'admin' ? 'badge-error' :
                          role === 'developer' ? 'badge-primary' : 'badge-ghost'
                        ]"
                      >
                        {{ getRoleLabel(role) }}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div
                      :class="[
                        'badge badge-sm',
                        user.status === 'active' ? 'badge-success' :
                        user.status === 'inactive' ? 'badge-warning' : 'badge-error'
                      ]"
                    >
                      {{ getStatusLabel(user.status) }}
                    </div>
                  </td>
                  <td>{{ formatDate(user.lastLoginAt || '') }}</td>
                  <td>{{ formatDate(user.createdAt || '') }}</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <!-- 🛡️ 编辑按钮 - 需要用户编辑权限 -->
                      <button
                        class="btn btn-outline btn-success btn-xs border-2 hover:bg-green-50"
                        @click="editUser(user)"
                        v-permission="{ permission: 'user:update' }"
                      >
                        编辑
                      </button>
                      <!-- 🛡️ 锁定/解锁按钮 - 需要用户状态管理权限 -->
                      <button
                        v-if="user.status === 'active'"
                        class="btn btn-outline btn-warning btn-xs border-2 hover:bg-yellow-50"
                        @click="toggleUserStatus(user, 'locked')"
                        v-permission="{ permission: 'user:status' }"
                      >
                        锁定
                      </button>
                      <button
                        v-else
                        class="btn btn-outline btn-success btn-xs border-2 hover:bg-green-50"
                        @click="toggleUserStatus(user, 'active')"
                        v-permission="{ permission: 'user:status' }"
                      >
                        解锁
                      </button>
                      <!-- 🛡️ 删除按钮 - 需要用户删除权限且不能删除自己 -->
                      <button
                        class="btn btn-outline btn-error btn-xs border-2 hover:bg-red-50"
                        @click="deleteUser(user)"
                        :disabled="user.id === currentUser?.id"
                        v-permission="{ permission: 'user:delete' }"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div class="card bg-base-100 shadow-lg mt-6">
            <div class="card-body py-4">
              <div class="flex flex-col lg:flex-row justify-between items-center gap-6">
                <!-- 分页按钮 -->
                <div class="join flex-shrink-0">
                  <button 
                    class="join-item btn btn-sm border-green-300 hover:bg-green-50"
                    :disabled="pagination.page <= 1"
                    @click="handlePageChange(pagination.page - 1)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </button>
                  <button class="join-item btn btn-sm bg-green-100 border-green-300 text-green-800 min-w-[100px]">
                    第 {{ pagination.page }} 页
                  </button>
                  <button 
                    class="join-item btn btn-sm border-green-300 hover:bg-green-50"
                    :disabled="pagination.page >= Math.ceil(pagination.total / pagination.limit)"
                    @click="handlePageChange(pagination.page + 1)"
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
                      v-model="pagination.limit" 
                      class="select select-bordered select-sm border-green-300 focus:border-green-500 min-w-[70px]"
                      @change="handlePageSizeChange(pagination.limit)"
                    >
                      <option :value="10">10</option>
                      <option :value="20">20</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                    </select>
                    <span class="whitespace-nowrap">条</span>
                  </div>
                  <div class="divider divider-horizontal mx-2"></div>
                  <span class="font-medium text-green-700 whitespace-nowrap">共 {{ pagination.total }} 条记录</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🆕 创建用户对话框 -->
    <div v-if="showCreateDialog" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg mb-4">创建新用户</h3>
        
        <form @submit.prevent="handleCreateUser" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">用户名 *</span>
            </label>
            <input 
              v-model="createForm.username" 
              type="text" 
              placeholder="请输入用户名" 
              class="input input-bordered w-full" 
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">邮箱 *</span>
            </label>
            <input 
              v-model="createForm.email" 
              type="email" 
              placeholder="请输入邮箱" 
              class="input input-bordered w-full" 
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">密码 *</span>
            </label>
            <input 
              v-model="createForm.password" 
              type="password" 
              placeholder="请输入密码" 
              class="input input-bordered w-full" 
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">显示名称</span>
            </label>
            <input 
              v-model="createForm.displayName" 
              type="text" 
              placeholder="请输入显示名称" 
              class="input input-bordered w-full" 
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">角色 *</span>
            </label>
            <div class="flex flex-wrap gap-4">
              <label class="cursor-pointer label">
                <input 
                  type="checkbox" 
                  value="admin" 
                  v-model="createForm.roles" 
                  class="checkbox checkbox-primary" 
                />
                <span class="label-text ml-2">管理员</span>
              </label>
              <label class="cursor-pointer label">
                <input 
                  type="checkbox" 
                  value="developer" 
                  v-model="createForm.roles" 
                  class="checkbox checkbox-primary" 
                />
                <span class="label-text ml-2">开发者</span>
              </label>
              <label class="cursor-pointer label">
                <input 
                  type="checkbox" 
                  value="guest" 
                  v-model="createForm.roles" 
                  class="checkbox checkbox-primary" 
                />
                <span class="label-text ml-2">访客</span>
              </label>
            </div>
          </div>
        </form>
        
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showCreateDialog = false; resetCreateForm()">取消</button>
          <button 
            class="btn btn-primary" 
            @click="handleCreateUser" 
            :disabled="creating"
          >
            <span v-if="creating" class="loading loading-spinner loading-sm"></span>
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ✏️ 编辑用户对话框 -->
    <div v-if="showEditDialog" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg mb-4">编辑用户</h3>
        
        <form @submit.prevent="handleUpdateUser" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">用户名</span>
            </label>
            <input 
              v-model="editForm.username" 
              type="text" 
              class="input input-bordered w-full" 
              disabled
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">邮箱 *</span>
            </label>
            <input 
              v-model="editForm.email" 
              type="email" 
              placeholder="请输入邮箱" 
              class="input input-bordered w-full" 
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">显示名称</span>
            </label>
            <input 
              v-model="editForm.displayName" 
              type="text" 
              placeholder="请输入显示名称" 
              class="input input-bordered w-full" 
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">角色 *</span>
            </label>
            <div class="flex flex-wrap gap-4">
              <label class="cursor-pointer label">
                <input 
                  type="checkbox" 
                  value="admin" 
                  v-model="editForm.roles" 
                  class="checkbox checkbox-primary" 
                />
                <span class="label-text ml-2">管理员</span>
              </label>
              <label class="cursor-pointer label">
                <input 
                  type="checkbox" 
                  value="developer" 
                  v-model="editForm.roles" 
                  class="checkbox checkbox-primary" 
                />
                <span class="label-text ml-2">开发者</span>
              </label>
              <label class="cursor-pointer label">
                <input 
                  type="checkbox" 
                  value="guest" 
                  v-model="editForm.roles" 
                  class="checkbox checkbox-primary" 
                />
                <span class="label-text ml-2">访客</span>
              </label>
            </div>
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">状态</span>
            </label>
            <div class="flex flex-wrap gap-4">
              <label class="cursor-pointer label">
                <input 
                  type="radio" 
                  value="active" 
                  v-model="editForm.status" 
                  class="radio radio-primary" 
                />
                <span class="label-text ml-2">活跃</span>
              </label>
              <label class="cursor-pointer label">
                <input 
                  type="radio" 
                  value="inactive" 
                  v-model="editForm.status" 
                  class="radio radio-primary" 
                />
                <span class="label-text ml-2">非活跃</span>
              </label>
              <label class="cursor-pointer label">
                <input 
                  type="radio" 
                  value="locked" 
                  v-model="editForm.status" 
                  class="radio radio-primary" 
                />
                <span class="label-text ml-2">锁定</span>
              </label>
            </div>
          </div>
        </form>
        
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showEditDialog = false; resetEditForm()">取消</button>
          <button 
            class="btn btn-primary" 
            @click="handleUpdateUser" 
            :disabled="updating"
          >
            <span v-if="updating" class="loading loading-spinner loading-sm"></span>
            {{ updating ? '更新中...' : '更新' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { User, Plus, Search } from '@/utils/iconMapping'
import { useAuthStore } from '@/stores/auth'
import { userApi } from '@/utils/api'
import type { User as UserType, UserRole, UserStatus } from '@/types'

// 🔔 原生消息提示函数
const showMessage = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  // 创建toast元素
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
  
  // 3秒后自动移除
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
        modal.remove()
      }
    })
  })
}

// 🔐 权限检查
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

// 📊 数据状态
const loading = ref(false)
const creating = ref(false)
const updating = ref(false)
const userList = ref<UserType[]>([])

// 🔍 搜索表单
const searchForm = reactive({
  keyword: '',
  role: '',
  status: ''
})

// 📄 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 🆕 创建用户表单
const showCreateDialog = ref(false)
const createFormRef = ref()
const createForm = reactive({
  username: '',
  email: '',
  password: '',
  displayName: '',
  roles: [] as UserRole[]
})

// ✏️ 编辑用户表单
const showEditDialog = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: '',
  username: '',
  email: '',
  displayName: '',
  roles: [] as UserRole[],
  status: 'active' as UserStatus
})

// 🔧 工具函数
const parseRoles = (roleString: string): UserRole[] => {
  if (!roleString) return ['guest']
  return roleString.split(',').map(role => role.trim() as UserRole)
}

const getRoleLabel = (role: UserRole): string => {
  const labels = {
    admin: '管理员',
    developer: '开发者',
    guest: '访客'
  }
  return labels[role] || role
}

const getStatusLabel = (status: UserStatus): string => {
  const labels = {
    active: '活跃',
    inactive: '非活跃',
    locked: '锁定'
  }
  return labels[status] || status
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '从未登录'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 📊 数据加载
const loadUsers = async () => {
  try {
    loading.value = true
    const options = {
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchForm.keyword,
      role: searchForm.role,
      status: searchForm.status
    }
    
    const response = await userApi.getUsers(options)
    userList.value = response.data
    pagination.total = response.pagination.total
  } catch (error: any) {
    console.error('❌ 加载用户列表失败:', error)
    showMessage(error.message || '加载用户列表失败', 'error')
  } finally {
    loading.value = false
  }
}

// 🔍 搜索处理
const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.role = ''
  searchForm.status = ''
  handleSearch()
}

// 📄 分页处理
const handlePageChange = (page: number) => {
  pagination.page = page
  loadUsers()
}

const handlePageSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadUsers()
}

// 🆕 创建用户
const resetCreateForm = () => {
  createForm.username = ''
  createForm.email = ''
  createForm.password = ''
  createForm.displayName = ''
  createForm.roles = []
  createFormRef.value?.resetFields()
}

const handleCreateUser = async () => {
  try {
    await createFormRef.value?.validate()
    creating.value = true
    
    const userData = {
      username: createForm.username,
      email: createForm.email,
      password: createForm.password,
      displayName: createForm.displayName,
      role: createForm.roles.join(',')
    }
    
    await userApi.createUser(userData)
    showMessage('✅ 用户创建成功', 'success')
    showCreateDialog.value = false
    resetCreateForm()
    loadUsers()
  } catch (error: any) {
    console.error('❌ 创建用户失败:', error)
    showMessage(error.message || '创建用户失败', 'error')
  } finally {
    creating.value = false
  }
}

// ✏️ 编辑用户
const editUser = (user: UserType) => {
  editForm.id = user.id
  editForm.username = user.username
  editForm.email = user.email
  editForm.displayName = user.displayName || ''
  editForm.roles = parseRoles(user.roles)
  editForm.status = user.status
  showEditDialog.value = true
}

const resetEditForm = () => {
  editForm.id = ''
  editForm.username = ''
  editForm.email = ''
  editForm.displayName = ''
  editForm.roles = []
  editForm.status = 'active'
  editFormRef.value?.resetFields()
}

const handleUpdateUser = async () => {
  try {
    await editFormRef.value?.validate()
    updating.value = true
    
    const userData = {
      email: editForm.email,
      displayName: editForm.displayName,
      role: editForm.roles.join(','),
      status: editForm.status
    }
    
    await userApi.updateUser(editForm.id, userData)
    showMessage('✅ 用户更新成功', 'success')
    showEditDialog.value = false
    resetEditForm()
    loadUsers()
  } catch (error: any) {
    console.error('❌ 更新用户失败:', error)
    showMessage(error.message || '更新用户失败', 'error')
  } finally {
    updating.value = false
  }
}

// 🔒 切换用户状态
const toggleUserStatus = async (user: UserType, newStatus: UserStatus) => {
  try {
    const action = newStatus === 'locked' ? '锁定' : '解锁'
    const confirmed = await showConfirm(
      `确定要${action}用户 "${user.username}" 吗？`,
      `${action}用户`
    )
    
    if (!confirmed) return
    
    await userApi.updateUser(user.id, { status: newStatus })
    showMessage(`✅ 用户${action}成功`, 'success')
    loadUsers()
  } catch (error: any) {
    console.error('❌ 切换用户状态失败:', error)
    showMessage(error.message || '操作失败', 'error')
  }
}

// 🗑️ 删除用户
const deleteUser = async (user: UserType) => {
  try {
    const confirmed = await showConfirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可恢复！`,
      '删除用户'
    )
    
    if (!confirmed) return
    
    await userApi.deleteUser(user.id)
    showMessage('✅ 用户删除成功', 'success')
    loadUsers()
  } catch (error: any) {
    console.error('❌ 删除用户失败:', error)
    showMessage(error.message || '删除用户失败', 'error')
  }
}

// 🚀 初始化
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
/* 清理了所有Element Plus相关的样式，现在使用DaisyUI组件 */
@reference "@/styles/main.css";

/* 自定义滚动条样式 */
.table-section ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-section ::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.table-section ::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.table-section ::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 统一卡片样式，与Dashboard保持一致 */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
}

/* 响应式设计优化 */
@media (max-width: 768px) {
  .search-section,
  .table-section {
    margin: 0;
  }
  
  /* 移动端优化表格显示 */
  .table-section .overflow-x-auto {
    border-radius: 0.5rem;
  }
}
</style>
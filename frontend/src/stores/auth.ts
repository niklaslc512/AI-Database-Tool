import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  User, 
  LoginRequest, 
  LoginResponse, 
  UpdateUserRequest,
  ChangePasswordRequest,
  ApiKey,
  CreateApiKeyRequest,
  AuthorizationToken,
  ExternalAuthRequest
} from '@/types'
import { api } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const apiKeys = ref<ApiKey[]>([])
  const authTokens = ref<AuthorizationToken[]>([])

  // 计算属性
  const userRole = computed(() => user.value?.role || 'guest')
  const userStatus = computed(() => user.value?.status || 'inactive')
  const isAdmin = computed(() => userRole.value === 'admin')
  const isActive = computed(() => userStatus.value === 'active')
  const canManageUsers = computed(() => isAdmin.value)
  const displayName = computed(() => user.value?.displayName || user.value?.username || '')

  // 认证相关方法
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      loading.value = true
      
      const response = await api.post<LoginResponse>('/users/auth/login', credentials)
      
      const { user: userData, token: userToken, refreshToken: userRefreshToken, expiresAt } = response
      
      // 保存用户信息和token
      user.value = userData
      token.value = userToken
      refreshToken.value = userRefreshToken || null
      isAuthenticated.value = true
      
      // 持久化存储
      localStorage.setItem('token', userToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      if (userRefreshToken) {
        localStorage.setItem('refreshToken', userRefreshToken)
      }
      
      if (credentials.rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      }
      
      return response
    } catch (error: any) {
      console.error('登录失败:', error)
      if (error.response?.status === 401) {
        error.code = 'INVALID_CREDENTIALS'
      }
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      // 调用登出API（如果需要）
      if (token.value) {
        // await api.post('/users/auth/logout')
      }
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      // 清除状态
      clearAuth()
    }
  }

  const getCurrentUser = async (): Promise<User> => {
    try {
      if (!token.value) {
        throw new Error('未找到访问令牌')
      }

      const response = await api.get<User>('/users/me')
      
      user.value = response
      isAuthenticated.value = true
      
      // 更新本地存储
      localStorage.setItem('user', JSON.stringify(response))
      
      return response
    } catch (error) {
      console.error('获取用户信息失败:', error)
      clearAuth()
      throw error
    }
  }

  const updateProfile = async (profileData: UpdateUserRequest): Promise<User> => {
    try {
      loading.value = true
      
      const response = await api.put<User>('/users/me', profileData)
      
      user.value = response
      localStorage.setItem('user', JSON.stringify(user.value))
      return response
    } catch (error) {
      console.error('更新个人资料失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const changePassword = async (passwordData: ChangePasswordRequest): Promise<void> => {
    try {
      loading.value = true
      await api.put('/users/me/password', passwordData)
    } catch (error) {
      console.error('修改密码失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // API Key 管理
  const loadApiKeys = async (): Promise<void> => {
    try {
      const response = await api.get<ApiKey[]>('/api-keys')
      apiKeys.value = response
    } catch (error) {
      console.error('加载API密钥失败:', error)
      throw error
    }
  }

  const createApiKey = async (keyData: CreateApiKeyRequest): Promise<{ apiKey: ApiKey; secret: string }> => {
    try {
      loading.value = true
      const response = await api.post<{ apiKey: ApiKey; secret: string }>('/api-keys', keyData)
      
      apiKeys.value.unshift(response.apiKey)
      return response
    } catch (error) {
      console.error('创建API密钥失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateApiKey = async (keyId: string, updateData: { name?: string; permissions?: string[] }): Promise<ApiKey> => {
    try {
      const response = await api.put<ApiKey>(`/api-keys/${keyId}`, updateData)
      
      const index = apiKeys.value.findIndex(key => key.id === keyId)
      if (index !== -1) {
        apiKeys.value[index] = response
      }
      return response
    } catch (error) {
      console.error('更新API密钥失败:', error)
      throw error
    }
  }

  const deleteApiKey = async (keyId: string): Promise<void> => {
    try {
      await api.delete(`/api-keys/${keyId}`)
      apiKeys.value = apiKeys.value.filter(key => key.id !== keyId)
    } catch (error) {
      console.error('删除API密钥失败:', error)
      throw error
    }
  }

  // 外部授权相关
  const createExternalAuth = async (authData: ExternalAuthRequest): Promise<{ token: string; expiresAt: string; authUrl?: string }> => {
    try {
      const response = await api.post<{ token: string; expiresAt: string; authUrl?: string }>('/auth/external/create', authData)
      return response
    } catch (error) {
      console.error('创建外部授权失败:', error)
      throw error
    }
  }

  const loginWithExternalToken = async (token: string, userId?: string): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/external/login', { token, userId })
      
      const { user: userData, jwtToken, expiresAt } = response
      
      // 保存用户信息和token
      user.value = userData
      token.value = jwtToken
      isAuthenticated.value = true
      
      // 持久化存储
      localStorage.setItem('token', jwtToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      return response
    } catch (error) {
      console.error('外部授权登录失败:', error)
      throw error
    }
  }

  const loadAuthTokens = async (): Promise<void> => {
    try {
      const response = await api.get<AuthorizationToken[]>('/auth/external/tokens')
      authTokens.value = response
    } catch (error) {
      console.error('加载授权令牌失败:', error)
      throw error
    }
  }

  // 工具方法
  const clearAuth = () => {
    user.value = null
    token.value = null
    refreshToken.value = null
    isAuthenticated.value = false
    apiKeys.value = []
    authTokens.value = []
    
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
  }

  const initializeAuth = () => {
    // 从本地存储恢复认证状态
    const savedToken = localStorage.getItem('token')
    const savedRefreshToken = localStorage.getItem('refreshToken')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        refreshToken.value = savedRefreshToken
        user.value = JSON.parse(savedUser)
        isAuthenticated.value = true
      } catch (error) {
        console.error('恢复认证状态失败:', error)
        clearAuth()
      }
    }
  }

  const hasRole = (role: string | string[]): boolean => {
    if (!user.value) return false
    
    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(userRole.value)
  }

  const checkPermission = (resource: string, action: string): boolean => {
    if (!user.value) return false
    
    // 管理员拥有所有权限
    if (user.value.role === 'admin') return true
    
    // 基于角色的简单权限检查
    if (user.value.role === 'readonly' && action !== 'read') return false
    if (user.value.role === 'guest' && !['read', 'list'].includes(action)) return false
    
    return true
  }

  // 初始化认证状态
  initializeAuth()

  return {
    // 状态
    user,
    token,
    refreshToken,
    isAuthenticated,
    loading,
    apiKeys,
    authTokens,
    
    // 计算属性
    userRole,
    userStatus,
    isAdmin,
    isActive,
    canManageUsers,
    displayName,
    
    // 认证方法
    login,
    logout,
    getCurrentUser,
    updateProfile,
    changePassword,
    clearAuth,
    
    // API Key 方法
    loadApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    
    // 外部授权方法
    createExternalAuth,
    loginWithExternalToken,
    loadAuthTokens,
    
    // 权限检查
    hasRole,
    checkPermission
  }
})
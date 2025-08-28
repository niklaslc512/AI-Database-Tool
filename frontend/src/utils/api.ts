import axios, { type AxiosResponse, type AxiosError } from 'axios'
import type {
  MessageResponse,
  SystemConfig,
  CreateConfigRequest,
  UpdateConfigRequest,
  LoginRequest,
  LoginResponse,
  User,
  PaginatedResult,
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  DatabaseConnection,
  TableInfo,
  ColumnInfo,
  SQLExecuteLog
} from '@/types'
// 🎨 使用原生浏览器API替代Element Plus消息组件
import { ApiLogger } from './logger'

// 扩展axios配置类型
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}

// 创建API日志记录器实例
const apiLogger = new ApiLogger()

// 创建axios实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000, // 默认30秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 创建专用于AI对话的axios实例，使用更长的超时时间
const aiApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 120000, // 🤖 AI对话使用2分钟超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 记录请求开始
    const startTime = apiLogger.logRequest(
      config.method?.toUpperCase() || 'GET',
      config.url || '',
      config.data
    )

    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求时间戳
    config.metadata = { startTime }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 记录请求成功
    apiLogger.logSuccess(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      response.config.metadata?.startTime || Date.now(),
      response.data
    )

    return response
  },
  (error: AxiosError) => {
    const response = error.response

    // 记录请求失败
    if (error.config?.metadata?.startTime) {
      apiLogger.logError(
        error.config.method?.toUpperCase() || 'GET',
        error.config.url || '',
        error.config.metadata.startTime,
        error
      )
    }

    if (response) {
      const { status, data } = response

      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          break

        case 403:
          console.error('没有权限执行此操作')
          break

        case 404:
          console.error('请求的资源不存在')
          break

        case 429:
          console.error('请求过于频繁，请稍后再试')
          break

        case 500:
          console.error('服务器内部错误，请稍后再试')
          break

        default:
          const message = (data as any)?.message || '请求失败'
          console.error(message)
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('请求超时，请检查网络连接')
    } else {
      console.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

// API方法
export const api = {
  // 通用GET请求
  get: <T = any>(url: string, params?: any): Promise<T> =>
    apiClient.get(url, { params }).then(res => res.data),

  // 通用POST请求
  post: <T = any>(url: string, data?: any): Promise<T> =>
    apiClient.post(url, data).then(res => res.data),

  // 通用PUT请求
  put: <T = any>(url: string, data?: any): Promise<T> =>
    apiClient.put(url, data).then(res => res.data),

  // 通用DELETE请求
  delete: <T = any>(url: string): Promise<T> =>
    apiClient.delete(url).then(res => res.data),

  // 通用PATCH请求
  patch: <T = any>(url: string, data?: any): Promise<T> =>
    apiClient.patch(url, data).then(res => res.data)
}

// 数据库连接相关API
export const connectionApi = {
  // 获取连接列表
  getConnections: (): Promise<DatabaseConnection[]> =>
    api.get('/connections'),

  // 创建连接
  createConnection: (data: {
    name: string
    type: string
    dsn: string
  }): Promise<DatabaseConnection> =>
    api.post('/connections', data),

  // 更新连接
  updateConnection: (id: string, data: {
    name?: string
    type?: string
    dsn?: string
  }): Promise<DatabaseConnection> =>
    api.put(`/connections/${id}`, data),

  // 删除连接
  deleteConnection: (id: string): Promise<MessageResponse> =>
    api.delete(`/connections/${id}`),

  // 测试连接
  testConnection: (data: { id: string }): Promise<{ success: boolean; message: string }> =>
    api.post('/connections/test', data),

  // 获取数据库列表
  getDatabases: (connectionId: string): Promise<string[]> =>
    api.get(`/connections/${connectionId}/databases`),

  // 获取表列表
  getTables: (connectionId: string, database?: string): Promise<any[]> =>
    api.get(`/db/${connectionId}/tables`, { database }),

  // 获取表结构
  getTableSchema: (connectionId: string, tableName: string): Promise<any> =>
    api.get(`/connections/${connectionId}/tables/${tableName}/schema`)
}

// 数据库表信息相关API
export const databaseApi = {
  // 获取数据库表信息（包含表注释和字段信息）
  getTablesWithDetails: (connectionId: string): Promise<{
    connectionId: string
    tableCount: number
    tables: Array<TableInfo & {
      columns: ColumnInfo[]
      error?: string
    }>
  }> =>
    api.get(`/db/${connectionId}/tables`)
}

// 认证相关API
export const authApi = {
  // 登录
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    api.post('/auth/login', credentials),

  // 注册
  register: (userData: any): Promise<User> =>
    api.post('/users', userData),

  // 登出
  logout: (): Promise<MessageResponse> =>
    api.post('/auth/logout'),

  // 获取当前用户
  getCurrentUser: (): Promise<User> =>
    api.get('/users/me'),

  // 更新个人资料
  updateProfile: (data: Partial<User>): Promise<User> =>
    api.put('/users/me', data),

  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }): Promise<MessageResponse> =>
    api.put('/users/me/password', data),

  // 刷新token
  refreshToken: (): Promise<{ token: string }> =>
    api.post('/auth/refresh')
}

// 系统配置相关API
export const configApi = {
  // 获取所有配置
  getConfigs: (options?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    category?: string
    search?: string
    includeValues?: boolean
  }): Promise<{ data: SystemConfig[], pagination: { total: number, page: number, limit: number, totalPages: number } }> => {
    const params: any = {}
    if (options?.page) params.page = options.page
    if (options?.limit) params.limit = options.limit
    if (options?.sortBy) params.sortBy = options.sortBy
    if (options?.sortOrder) params.sortOrder = options.sortOrder
    if (options?.category) params.category = options.category
    if (options?.search) params.search = options.search
    if (options?.includeValues !== undefined) params.includeValues = options.includeValues.toString()
    return api.get('/configs', params)
  },

  // 获取单个配置
  getConfig: (key: string): Promise<SystemConfig> =>
    api.get(`/configs/${key}`),

  // 创建配置
  createConfig: (data: CreateConfigRequest): Promise<SystemConfig> =>
    api.post('/configs', data),

  // 更新配置
  updateConfig: (key: string, data: UpdateConfigRequest): Promise<SystemConfig> =>
    api.put(`/configs/${key}`, data),

  // 删除配置
  deleteConfig: (key: string): Promise<MessageResponse> =>
    api.delete(`/configs/${key}`),

  // 重新加载配置
  reloadConfigs: (): Promise<MessageResponse> =>
    api.post('/configs/reload')
}

// 用户管理相关API
export const userApi = {
  // 获取用户列表
  getUsers: (options?: {
    page?: number
    limit?: number
    keyword?: string
    role?: string
    status?: string
  }): Promise<PaginatedResult<User>> => {
    const params: any = {}
    if (options?.page) params.page = options.page
    if (options?.limit) params.limit = options.limit
    if (options?.keyword) params.keyword = options.keyword
    if (options?.role) params.role = options.role
    if (options?.status) params.status = options.status
    return api.get('/users', params)
  },

  // 创建用户
  createUser: (userData: {
    username: string
    email: string
    password: string
    displayName?: string
    role: string
  }): Promise<User> =>
    api.post('/users', userData),

  // 更新用户
  updateUser: (id: string, userData: {
    email?: string
    displayName?: string
    role?: string
    status?: string
  }): Promise<User> =>
    api.put(`/users/${id}`, userData),

  // 删除用户
  deleteUser: (id: string): Promise<MessageResponse> =>
    api.delete(`/users/${id}`),

  // 获取单个用户
  getUser: (id: string): Promise<User> =>
    api.get(`/users/${id}`),

  // 重置用户密码
  resetPassword: (id: string, newPassword: string): Promise<MessageResponse> =>
    api.put(`/users/${id}/password`, { password: newPassword }),

  // 批量删除用户
  batchDeleteUsers: (ids: string[]): Promise<MessageResponse> =>
    api.post('/users/batch-delete', { ids })
}

// API密钥相关API
export const apiKeyApi = {
  // 获取API密钥列表
  getApiKeys: (): Promise<ApiKey[]> =>
    api.get('/api-keys'),

  // 创建API密钥
  createApiKey: (data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> =>
    api.post('/api-keys', data),

  // 更新API密钥
  updateApiKey: (id: string, data: {
    name?: string
    permissions?: string[]
    databaseIds?: string[]
    expiresAt?: string
    isActive?: boolean
  }): Promise<ApiKey> =>
    api.put(`/api-keys/${id}`, data),

  // 删除API密钥
  deleteApiKey: (id: string): Promise<MessageResponse> =>
    api.delete(`/api-keys/${id}`),

  // 切换API密钥状态
  toggleApiKeyStatus: (id: string, isActive: boolean): Promise<ApiKey> =>
    api.put(`/api-keys/${id}`, { isActive }),

  // 获取单个API密钥
  getApiKey: (id: string): Promise<ApiKey> =>
    api.get(`/api-keys/${id}`),

  // 获取可用权限列表
  getAvailablePermissions: (): Promise<Array<{
    value: string
    label: string
    description: string
  }>> =>
    api.get('/api-keys/available-permissions')
}

// 为AI专用客户端添加拦截器
aiApiClient.interceptors.request.use(
  (config) => {
    // 记录请求开始
    const startTime = apiLogger.logRequest(
      config.method?.toUpperCase() || 'GET',
      config.url || '',
      config.data
    )

    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求时间戳
    config.metadata = { startTime }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

aiApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 记录请求成功
    apiLogger.logSuccess(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      response.config.metadata?.startTime || Date.now(),
      response.data
    )

    return response
  },
  (error: AxiosError) => {
    const response = error.response

    // 记录请求失败
    if (error.config?.metadata?.startTime) {
      apiLogger.logError(
        error.config.method?.toUpperCase() || 'GET',
        error.config.url || '',
        error.config.metadata.startTime,
        error
      )
    }

    if (response) {
      const { status, data } = response

      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          break

        case 403:
          console.error('没有权限执行此操作')
          break

        case 404:
          console.error('请求的资源不存在')
          break

        case 429:
          console.error('请求过于频繁，请稍后再试')
          break

        case 500:
          console.error('服务器内部错误，请稍后再试')
          break

        default:
          const message = (data as any)?.message || '请求失败'
          console.error(message)
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('🤖 AI对话请求超时，请稍后重试')
    } else {
      console.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

/**
 * 🤖 AI对话相关API
 */
export const aiApi = {
  // 发送AI对话消息（使用专用的长超时客户端）
  chat: (dbId: string, data: { message: string; conversation_id?: string }): Promise<{
    conversation_id: string;
    sql: string;
    reply: string;
    response_time: number;
  }> =>
    aiApiClient.post(`/db/${dbId}/chat`, data).then(res => res.data),
  
  // 获取对话历史
  getConversationHistory: (conversationId: string, params?: { limit?: number; before_message_id?: string }): Promise<{
    conversation_id: string;
    messages: any[];
    total: number;
  }> => 
    api.get(`/ai/conversations/${conversationId}/history`, params)
};

/**
 * 🗄️ SQL查询执行相关API
 */
export const sqlApi = {
  // 执行SQL查询
  executeQuery: (dbId: string, data: { sql: string; conversation_id?: string }): Promise<{
    success: boolean;
    data: any[];
    rows_affected: number;
    execution_time: number;
    columns: any[];
  }> => 
    api.post(`/db/${dbId}/query`, data),
  
  // 获取SQL执行日志
  getExecuteLogs: (params?: {
    database_connection_id?: string;
    conversation_id?: string;
    status?: 'success' | 'error';
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<SQLExecuteLog>> => 
    api.get('/db/execute-logs', params),
  
  // 获取特定SQL执行日志详情
  getExecuteLogDetail: (logId: string): Promise<SQLExecuteLog> =>
    api.get(`/db/execute-logs/${logId}`)
};

// 🔄 导出别名以保持向后兼容性
export { api as apiService }

export default api
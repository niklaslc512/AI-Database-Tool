import axios, { type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { LoginRequest, LoginResponse, User, ErrorResponse, MessageResponse } from '@/types'
import { ElMessage } from 'element-plus'
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
  timeout: 30000,
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
          ElMessage.error('没有权限执行此操作')
          break
          
        case 404:
          ElMessage.error('请求的资源不存在')
          break
          
        case 429:
          ElMessage.error('请求过于频繁，请稍后再试')
          break
          
        case 500:
          ElMessage.error('服务器内部错误，请稍后再试')
          break
          
        default:
          const message = (data as any)?.message || '请求失败'
          ElMessage.error(message)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
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

// 认证相关API
export const authApi = {
  // 登录
  login: (credentials: LoginRequest): Promise<LoginResponse> =>
    api.post('/users/auth/login', credentials),
    
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

// 数据库连接相关API
export const connectionApi = {
  // 获取连接列表
  getConnections: (): Promise<any> =>
    api.get('/connections'),
    
  // 创建连接
  createConnection: (data: any): Promise<any> =>
    api.post('/connections', data),
    
  // 更新连接
  updateConnection: (id: string, data: any): Promise<any> =>
    api.put(`/connections/${id}`, data),
    
  // 删除连接
  deleteConnection: (id: string): Promise<MessageResponse> =>
    api.delete(`/connections/${id}`),
    
  // 测试连接
  testConnection: (data: any): Promise<any> =>
    api.post('/connections/test', data),
    
  // 获取数据库列表
  getDatabases: (connectionId: string): Promise<any> =>
    api.get(`/connections/${connectionId}/databases`),
    
  // 获取表列表
  getTables: (connectionId: string, database?: string): Promise<any> =>
    api.get(`/connections/${connectionId}/tables`, { database }),
    
  // 获取表结构
  getTableSchema: (connectionId: string, tableName: string): Promise<any> =>
    api.get(`/connections/${connectionId}/tables/${tableName}/schema`)
}

// 查询相关API
export const queryApi = {
  // 执行SQL查询
  executeQuery: (connectionId: string, sql: string): Promise<any> =>
    api.post(`/query/${connectionId}/execute`, { sql }),
    
  // AI自然语言查询
  naturalQuery: (connectionId: string, naturalQuery: string): Promise<any> =>
    api.post(`/query/${connectionId}/natural`, { naturalQuery }),
    
  // 获取查询历史
  getQueryHistory: (connectionId?: string): Promise<any> =>
    api.get('/query/history', { connectionId }),
    
  // 保存查询
  saveQuery: (data: any): Promise<any> =>
    api.post('/query/save', data),
    
  // 获取保存的查询
  getSavedQueries: (): Promise<any> =>
    api.get('/query/saved')
}

// AI相关API
export const aiApi = {
  // 生成SQL
  generateSQL: (data: any): Promise<any> =>
    api.post('/ai/generate-sql', data),
    
  // SQL解释
  explainSQL: (sql: string): Promise<any> =>
    api.post('/ai/explain-sql', { sql }),
    
  // SQL优化建议
  optimizeSQL: (sql: string): Promise<any> =>
    api.post('/ai/optimize-sql', { sql }),
    
  // 表结构建议
  suggestTableStructure: (description: string): Promise<any> =>
    api.post('/ai/suggest-table', { description })
}

export default api
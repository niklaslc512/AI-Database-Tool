import axios, { type AxiosResponse, type AxiosError } from 'axios'
import type { ApiResponse, LoginRequest, LoginResponse, User } from '@/types'
import { ElMessage } from 'element-plus'

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
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳
    config.metadata = { startTime: Date.now() }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 计算请求耗时
    const endTime = Date.now()
    const startTime = response.config.metadata?.startTime || endTime
    const duration = endTime - startTime
    
    // 开发环境显示请求信息
    if (import.meta.env.DEV) {
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`)
    }
    
    return response
  },
  (error: AxiosError) => {
    const response = error.response
    
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
  get: <T = any>(url: string, params?: any): Promise<ApiResponse<T>> =>
    apiClient.get(url, { params }).then(res => res.data),
    
  // 通用POST请求
  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.post(url, data).then(res => res.data),
    
  // 通用PUT请求
  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.put(url, data).then(res => res.data),
    
  // 通用DELETE请求
  delete: <T = any>(url: string): Promise<ApiResponse<T>> =>
    apiClient.delete(url).then(res => res.data),
    
  // 通用PATCH请求
  patch: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    apiClient.patch(url, data).then(res => res.data)
}

// 认证相关API
export const authApi = {
  // 登录
  login: (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/login', credentials),
    
  // 注册
  register: (userData: any): Promise<ApiResponse<User>> =>
    api.post('/auth/register', userData),
    
  // 登出
  logout: (): Promise<ApiResponse> =>
    api.post('/auth/logout'),
    
  // 获取当前用户
  getCurrentUser: (): Promise<ApiResponse<User>> =>
    api.get('/auth/me'),
    
  // 更新个人资料
  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> =>
    api.put('/auth/profile', data),
    
  // 修改密码
  changePassword: (data: { oldPassword: string; newPassword: string }): Promise<ApiResponse> =>
    api.post('/auth/change-password', data),
    
  // 刷新token
  refreshToken: (): Promise<ApiResponse<{ token: string }>> =>
    api.post('/auth/refresh')
}

// 数据库连接相关API
export const connectionApi = {
  // 获取连接列表
  getConnections: (): Promise<ApiResponse> =>
    api.get('/connections'),
    
  // 创建连接
  createConnection: (data: any): Promise<ApiResponse> =>
    api.post('/connections', data),
    
  // 更新连接
  updateConnection: (id: string, data: any): Promise<ApiResponse> =>
    api.put(`/connections/${id}`, data),
    
  // 删除连接
  deleteConnection: (id: string): Promise<ApiResponse> =>
    api.delete(`/connections/${id}`),
    
  // 测试连接
  testConnection: (data: any): Promise<ApiResponse> =>
    api.post('/connections/test', data),
    
  // 获取数据库列表
  getDatabases: (connectionId: string): Promise<ApiResponse> =>
    api.get(`/connections/${connectionId}/databases`),
    
  // 获取表列表
  getTables: (connectionId: string, database?: string): Promise<ApiResponse> =>
    api.get(`/connections/${connectionId}/tables`, { database }),
    
  // 获取表结构
  getTableSchema: (connectionId: string, tableName: string): Promise<ApiResponse> =>
    api.get(`/connections/${connectionId}/tables/${tableName}/schema`)
}

// 查询相关API
export const queryApi = {
  // 执行SQL查询
  executeQuery: (connectionId: string, sql: string): Promise<ApiResponse> =>
    api.post(`/query/${connectionId}/execute`, { sql }),
    
  // AI自然语言查询
  naturalQuery: (connectionId: string, naturalQuery: string): Promise<ApiResponse> =>
    api.post(`/query/${connectionId}/natural`, { naturalQuery }),
    
  // 获取查询历史
  getQueryHistory: (connectionId?: string): Promise<ApiResponse> =>
    api.get('/query/history', { connectionId }),
    
  // 保存查询
  saveQuery: (data: any): Promise<ApiResponse> =>
    api.post('/query/save', data),
    
  // 获取保存的查询
  getSavedQueries: (): Promise<ApiResponse> =>
    api.get('/query/saved')
}

// AI相关API
export const aiApi = {
  // 生成SQL
  generateSQL: (data: any): Promise<ApiResponse> =>
    api.post('/ai/generate-sql', data),
    
  // SQL解释
  explainSQL: (sql: string): Promise<ApiResponse> =>
    api.post('/ai/explain-sql', { sql }),
    
  // SQL优化建议
  optimizeSQL: (sql: string): Promise<ApiResponse> =>
    api.post('/ai/optimize-sql', { sql }),
    
  // 表结构建议
  suggestTableStructure: (description: string): Promise<ApiResponse> =>
    api.post('/ai/suggest-table', { description })
}

export default api
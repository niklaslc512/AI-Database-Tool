import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'

/**
 * 🛡️ 权限工具函数集合
 * 提供各种权限检查和角色验证的工具方法
 */

/**
 * 🔐 检查用户是否有指定权限
 * @param permission 权限标识
 * @returns 是否有权限
 */
export function hasPermission(permission: string): boolean {
  const authStore = useAuthStore()
  return authStore.checkUserPermission(permission)
}

/**
 * 👥 检查用户是否有指定角色（任一匹配）
 * @param roles 角色数组
 * @returns 是否有任一角色
 */
export function hasAnyRole(roles: UserRole[]): boolean {
  const authStore = useAuthStore()
  return authStore.checkUserRoles(roles)
}

/**
 * 👥 检查用户是否有指定角色（全部匹配）
 * @param roles 角色数组
 * @returns 是否有全部角色
 */
export function hasAllRoles(roles: UserRole[]): boolean {
  const authStore = useAuthStore()
  return roles.every(role => authStore.checkUserRole(role))
}

/**
 * 🔍 检查用户是否有特定角色
 * @param role 角色
 * @returns 是否有该角色
 */
export function hasRole(role: UserRole): boolean {
  const authStore = useAuthStore()
  return authStore.checkUserRole(role)
}

/**
 * 🔐 检查是否为管理员
 * @returns 是否为管理员
 */
export function isAdmin(): boolean {
  const authStore = useAuthStore()
  return authStore.isAdmin
}

/**
 * 👨‍💻 检查是否为开发者
 * @returns 是否为开发者
 */
export function isDeveloper(): boolean {
  const authStore = useAuthStore()
  return authStore.isDeveloper
}

/**
 * 👤 检查是否为访客
 * @returns 是否为访客
 */
export function isGuest(): boolean {
  const authStore = useAuthStore()
  return authStore.checkUserRole('guest')
}

/**
 * 🔒 检查用户是否已认证
 * @returns 是否已认证
 */
export function isAuthenticated(): boolean {
  const authStore = useAuthStore()
  return authStore.isAuthenticated
}

/**
 * 🎭 获取用户角色显示文本
 * @param roleString 角色字符串
 * @returns 角色显示文本
 */
export function getRoleDisplayText(roleString?: string): string {
  if (!roleString) return '访客'
  
  const authStore = useAuthStore()
  const roles = authStore.parseRoles(roleString)
  const roleLabels = {
    admin: '管理员',
    developer: '开发者',
    guest: '访客'
  }
  
  return roles.map(role => roleLabels[role] || role).join('、')
}

/**
 * 🔐 权限检查配置对象
 */
export interface PermissionConfig {
  /** 需要的权限 */
  permission?: string
  /** 需要的角色（任一匹配） */
  roles?: UserRole[]
  /** 需要的角色（全部匹配） */
  requireAllRoles?: UserRole[]
}

/**
 * 🛡️ 综合权限检查
 * @param config 权限配置
 * @returns 是否通过权限检查
 */
export function checkPermissions(config: PermissionConfig): boolean {
  const { permission, roles, requireAllRoles } = config
  
  // 检查具体权限
  if (permission && !hasPermission(permission)) {
    return false
  }
  
  // 检查角色权限（任一匹配）
  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return false
  }
  
  // 检查角色权限（全部匹配）
  if (requireAllRoles && requireAllRoles.length > 0 && !hasAllRoles(requireAllRoles)) {
    return false
  }
  
  return true
}

/**
 * 🚫 权限不足时的默认处理
 * @param message 提示信息
 */
export function handlePermissionDenied(message = '权限不足，无法执行此操作'): void {
  console.warn(`🚫 ${message}`)
  // 这里可以添加全局提示逻辑
  // 例如: ElMessage.warning(message)
}

/**
 * 🔄 权限装饰器（用于方法权限检查）
 * @param config 权限配置
 * @returns 装饰器函数
 */
export function requirePermission(config: PermissionConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      if (!checkPermissions(config)) {
        handlePermissionDenied(`执行 ${propertyKey} 方法需要相应权限`)
        return
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

/**
 * 📋 获取用户可访问的菜单项
 * @param menuItems 菜单项数组
 * @returns 过滤后的菜单项
 */
export function getAccessibleMenuItems(menuItems: any[]): any[] {
  return menuItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) {
      return false
    }
    
    if (item.roles && !hasAnyRole(item.roles)) {
      return false
    }
    
    return true
  })
}
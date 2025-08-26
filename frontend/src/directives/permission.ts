import type { App, DirectiveBinding } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'

interface PermissionValue {
  /** 🔐 需要的权限 */
  permission?: string
  /** 👥 需要的角色（任一匹配即可） */
  roles?: UserRole[]
  /** 👥 需要的角色（全部匹配） */
  requireAllRoles?: UserRole[]
  /** 🎭 权限不足时的处理方式: 'hide' | 'disable' */
  action?: 'hide' | 'disable'
}

/**
 * 🛡️ 权限指令
 * 
 * 用法示例:
 * ```vue
 * <!-- 基于权限隐藏元素 -->
 * <button v-permission="{ permission: 'user:create' }">创建用户</button>
 * 
 * <!-- 基于角色隐藏元素 -->
 * <div v-permission="{ roles: ['admin', 'developer'] }">管理功能</div>
 * 
 * <!-- 权限不足时禁用而不是隐藏 -->
 * <button v-permission="{ permission: 'user:delete', action: 'disable' }">删除用户</button>
 * 
 * <!-- 需要全部角色匹配 -->
 * <div v-permission="{ requireAllRoles: ['admin', 'superuser'] }">超级管理功能</div>
 * ```
 */
const permissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    checkPermission(el, binding)
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    checkPermission(el, binding)
  }
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
  const { permission, roles, requireAllRoles, action = 'hide' } = binding.value || {}
  const authStore = useAuthStore()
  
  let hasPermission = true
  
  // 🔐 检查具体权限
  if (permission) {
    hasPermission = authStore.checkUserPermission(permission)
    if (!hasPermission) {
      console.warn(`🚫 指令权限检查失败: ${permission}`)
    }
  }
  
  // 👥 检查角色权限（任一匹配）
  if (hasPermission && roles && roles.length > 0) {
    hasPermission = authStore.checkUserRoles(roles)
    if (!hasPermission) {
      console.warn(`🚫 指令角色检查失败: ${roles.join(', ')}`)
    }
  }
  
  // 👥 检查角色权限（全部匹配）
  if (hasPermission && requireAllRoles && requireAllRoles.length > 0) {
    hasPermission = requireAllRoles.every(role => authStore.checkUserRole(role))
    if (!hasPermission) {
      console.warn(`🚫 指令全角色检查失败: ${requireAllRoles.join(', ')}`)
    }
  }
  
  // 🎭 根据权限检查结果处理元素
  if (!hasPermission) {
    if (action === 'hide') {
      // 隐藏元素
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    } else if (action === 'disable') {
      // 禁用元素
      el.setAttribute('disabled', 'true')
      el.style.opacity = '0.5'
      el.style.cursor = 'not-allowed'
      el.setAttribute('data-permission-disabled', 'true')
      
      // 阻止点击事件
      const preventClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
      el.addEventListener('click', preventClick, true)
      el.addEventListener('mousedown', preventClick, true)
    }
  } else {
    // 恢复元素状态
    if (el.getAttribute('data-permission-hidden') === 'true') {
      el.style.display = ''
      el.removeAttribute('data-permission-hidden')
    }
    
    if (el.getAttribute('data-permission-disabled') === 'true') {
      el.removeAttribute('disabled')
      el.style.opacity = ''
      el.style.cursor = ''
      el.removeAttribute('data-permission-disabled')
      
      // 移除事件监听器（需要重新克隆元素来清除所有监听器）
      const newEl = el.cloneNode(true) as HTMLElement
      el.parentNode?.replaceChild(newEl, el)
    }
  }
}

/**
 * 🔧 安装权限指令
 */
export function setupPermissionDirective(app: App) {
  app.directive('permission', permissionDirective)
}

export default permissionDirective
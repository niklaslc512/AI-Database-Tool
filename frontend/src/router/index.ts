import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PERMISSIONS } from '@/types'

// 布局组件
const Layout = () => import('@/components/Layout/MainLayout.vue')

// 页面组件
const Home = () => import('@/views/Home/index.vue')
const Dashboard = () => import('@/views/Dashboard/index.vue')
const Connections = () => import('@/views/Connections/index.vue')
const QueryWorkspace = () => import('@/views/Query/index.vue')
const Settings = () => import('@/views/Settings/index.vue')
const Login = () => import('@/views/Auth/Login.vue')
const Register = () => import('@/views/Auth/Register.vue')

// 🔐 Admin专用页面
const UserManagement = () => import('@/views/Admin/UserManagement.vue')
const SystemSettings = () => import('@/views/Admin/SystemSettings.vue')

// 👨‍💻 Developer专用页面
const DatabaseManagement = () => import('@/views/Developer/DatabaseManagement.vue')
const ApiKeyManagement = () => import('@/views/Developer/ApiKeyManagement.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页',
      requiresAuth: false
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '注册',
      requiresAuth: false
    }
  },
  {
    path: '/app',
    component: Layout,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: '/app/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: '仪表板',
          icon: 'Dashboard',
          requiresPermission: PERMISSIONS.DASHBOARD_VIEW,
          roles: ['admin', 'developer', 'guest']
        }
      },
      {
        path: 'connections',
        name: 'Connections',
        component: Connections,
        meta: {
          title: '数据库连接',
          icon: 'Connection',
          requiresPermission: PERMISSIONS.DATABASE_VIEW,
          roles: ['developer']
        }
      },
      {
        path: 'query/:connectionId?',
        name: 'QueryWorkspace',
        component: QueryWorkspace,
        meta: {
          title: '查询工作台',
          icon: 'Search',
          requiresPermission: PERMISSIONS.QUERY_WORKSPACE,
          roles: ['developer', 'guest']
        }
      },
      // 🔐 Admin专用路由
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
          title: '用户管理',
          icon: 'User',
          requiresPermission: PERMISSIONS.USER_MANAGEMENT,
          roles: ['admin']
        }
      },
      {
        path: 'system',
        name: 'SystemSettings',
        component: SystemSettings,
        meta: {
          title: '系统设置',
          icon: 'Setting',
          requiresPermission: PERMISSIONS.SYSTEM_SETTINGS,
          roles: ['admin']
        }
      },
      // 👨‍💻 Developer专用路由
      {
        path: 'database',
        name: 'DatabaseManagement',
        component: DatabaseManagement,
        meta: {
          title: '数据库表管理',
          icon: 'Database',
          requiresPermission: PERMISSIONS.DATABASE_MANAGEMENT,
          roles: ['developer']
        }
      },
      {
        path: 'apikeys',
        name: 'ApiKeyManagement',
        component: ApiKeyManagement,
        meta: {
          title: 'API密钥管理',
          icon: 'Key',
          requiresPermission: PERMISSIONS.APIKEY_MANAGEMENT,
          roles: ['developer']
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: {
          title: '个人设置',
          icon: 'User',
          requiresPermission: PERMISSIONS.DASHBOARD_VIEW,
          roles: ['admin', 'developer', 'guest']
        }
      },
      // 🧪 权限测试页面（仅开发环境）
      {
        path: 'permission-test',
        name: 'PermissionTest',
        component: () => import('@/views/Test/PermissionTest.vue'),
        meta: {
          title: '权限测试',
          icon: 'Shield',
          requiresPermission: PERMISSIONS.DASHBOARD_VIEW,
          roles: ['admin', 'developer']
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Error/404.vue'),
    meta: {
      title: '页面未找到'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 🛡️ 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - AI数据库管理系统`
  }

  // 检查认证
  const token = localStorage.getItem('token')
  const requiresAuth = to.meta?.requiresAuth !== false

  if (requiresAuth && !token) {
    // 需要认证但没有token，跳转到登录页
    next('/login')
    return
  }

  if (!requiresAuth && token && (to.path === '/login' || to.path === '/register')) {
    // 已登录用户访问登录/注册页，跳转到仪表板
    next('/app/dashboard')
    return
  }

  // 🔐 权限检查
  if (requiresAuth && token) {
    const authStore = useAuthStore()
    
    // 检查角色权限
    if (to.meta?.roles && Array.isArray(to.meta.roles)) {
      const hasRequiredRole = authStore.checkUserRoles(to.meta.roles as any[])
      if (!hasRequiredRole) {
        console.warn(`🚫 用户角色不足，无法访问页面: ${to.path}`)
        next('/app/dashboard') // 重定向到仪表板
        return
      }
    }
    
    // 检查具体权限
    if (to.meta?.requiresPermission) {
      const hasPermission = authStore.checkUserPermission(to.meta.requiresPermission as string)
      if (!hasPermission) {
        console.warn(`🚫 用户权限不足，无法访问页面: ${to.path}`)
        next('/app/dashboard') // 重定向到仪表板
        return
      }
    }
  }

  next()
})

export default router
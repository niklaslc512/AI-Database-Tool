import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 布局组件
const Layout = () => import('@/components/Layout/MainLayout.vue')

// 页面组件
const Home = () => import('@/views/Home/index.vue')
const Dashboard = () => import('@/views/Dashboard/index.vue')
const Connections = () => import('@/views/Connections/index.vue')
const QueryWorkspace = () => import('@/views/Query/index.vue')
const AIAssistant = () => import('@/views/AI/index.vue')
const Settings = () => import('@/views/Settings/index.vue')
const Login = () => import('@/views/Auth/Login.vue')
const Register = () => import('@/views/Auth/Register.vue')

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
          icon: 'Dashboard'
        }
      },
      {
        path: 'connections',
        name: 'Connections',
        component: Connections,
        meta: {
          title: '数据库连接',
          icon: 'Connection'
        }
      },
      {
        path: 'query/:connectionId?',
        name: 'QueryWorkspace',
        component: QueryWorkspace,
        meta: {
          title: '查询工作台',
          icon: 'Search'
        }
      },
      {
        path: 'ai-assistant',
        name: 'AIAssistant',
        component: AIAssistant,
        meta: {
          title: 'AI助手',
          icon: 'ChatLineRound'
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: {
          title: '设置',
          icon: 'Setting'
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

// 路由守卫
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
  } else if (!requiresAuth && token && (to.path === '/login' || to.path === '/register')) {
    // 已登录用户访问登录/注册页，跳转到仪表板
    next('/app/dashboard')
  } else {
    next()
  }
})

export default router
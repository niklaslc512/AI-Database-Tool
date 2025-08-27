<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 侧边栏 -->
    <aside
      :class="[
        'fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-in-out',
        'w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
        sidebarCollapsed ? '-translate-x-full' : 'translate-x-0',
        'lg:translate-x-0'
      ]"
    >
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 h-16">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">AI</span>
            </div>
            <div class="text-xl font-bold text-gray-900 dark:text-white">
              数据库管理
            </div>
          </div>
        </div>

        <!-- 导航菜单 -->
        <nav class="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
              $route.path === item.path
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <Squares2X2Icon v-if="item.icon === 'Grid'" class="w-5 h-5 mr-3" />
            <MagnifyingGlassIcon v-else-if="item.icon === 'Search'" class="w-5 h-5 mr-3" />
            <CogIcon v-else-if="item.icon === 'Setting'" class="w-5 h-5 mr-3" />
            <TableCellsIcon v-else-if="item.icon === 'DataBoard'" class="w-5 h-5 mr-3" />
            <KeyIcon v-else-if="item.icon === 'Key'" class="w-5 h-5 mr-3" />
            <UserIcon v-else-if="item.icon === 'User'" class="w-5 h-5 mr-3" />
            <component v-else :is="item.icon" class="w-5 h-5 mr-3" />
            {{ item.title }}
          </router-link>
        </nav>

        <!-- 用户信息 -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <UserIcon class="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ user?.username || '用户' }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ getRoleDisplayText(user?.roles) }}
              </div>
            </div>
            <div class="relative">
              <button 
                @click="toggleDropdown" 
                class="btn btn-ghost btn-circle"
                type="button"
              >
                <EllipsisVerticalIcon class="w-4 h-4" />
              </button>
              <div 
                v-if="dropdownOpen" 
                class="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50"
              >
                <div class="py-1">
                  <button 
                    @click="handleLogout" 
                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ArrowRightOnRectangleIcon class="w-4 h-4 mr-2" />
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div :class="['lg:ml-64 transition-all duration-300 ease-in-out h-screen flex flex-col']">
      <!-- 顶部导航栏 -->
      <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 h-16">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- 移动端菜单按钮 -->
            <button
              @click="toggleSidebar"
              class="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <Bars3Icon class="w-5 h-5" />
            </button>

            <!-- 面包屑导航 -->
            <nav class="flex" aria-label="Breadcrumb">
              <ol class="flex items-center space-x-2 text-sm">
                <li>
                  <router-link to="/" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    首页
                  </router-link>
                </li>
                <li v-if="currentPageTitle">
                  <div class="flex items-center">
                    <ChevronRightIcon class="w-4 h-4 mx-2 text-gray-400" />
                    <span class="text-gray-900 dark:text-white">{{ currentPageTitle }}</span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          <div class="flex items-center space-x-4">
            <!-- 主题切换 -->
            <button
              @click="toggleTheme"
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <SunIcon v-if="isDarkMode" class="w-5 h-5" />
              <MoonIcon v-else class="w-5 h-5" />
            </button>

            <!-- 通知 -->
            <button class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 relative">
              <BellIcon class="w-5 h-5" />
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="p-6 flex-1 overflow-auto">
        <router-view />
      </main>
    </div>

    <!-- 移动端遮罩层 -->
    <div
      v-if="!sidebarCollapsed"
      @click="toggleSidebar"
      class="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import {
  Bars3Icon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  EllipsisVerticalIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  CogIcon,
  TableCellsIcon,
  KeyIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// 响应式数据
const dropdownOpen = ref(false)

// 计算属性
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const isDarkMode = computed(() => appStore.isDarkMode)
const user = computed(() => authStore.user)

const currentPageTitle = computed(() => {
  return route.meta?.title as string
})

// 🔐 基于角色的菜单项
const menuItems = computed(() => {
  const items = []

  // 📊 仪表板 - 所有角色都可以访问
  items.push({
    path: '/app/dashboard',
    title: '仪表板',
    icon: 'Grid',
    roles: ['admin', 'developer', 'guest']
  })

  // 👨‍💻 Developer专用菜单
  if (authStore.canManageDatabase) {
    items.push({
      path: '/app/database',
      title: '数据库表管理',
      icon: 'DataBoard',
      roles: ['developer']
    })
  }

  if (authStore.canAccessQueryWorkspace) {
    items.push({
      path: '/app/query',
      title: '查询工作台',
      icon: 'Search',
      roles: ['developer']
    })
  }

  if (authStore.canManageApiKeys) {
    items.push({
      path: '/app/apikeys',
      title: 'API密钥管理',
      icon: 'Key',
      roles: ['developer']
    })
  }

  // 🔐 Admin专用菜单
  if (authStore.canManageUsers) {
    items.push({
      path: '/app/users',
      title: '用户管理',
      icon: 'User',
      roles: ['admin']
    })
  }

  if (authStore.canManageSystem) {
    items.push({
      path: '/app/system',
      title: '系统设置',
      icon: 'Setting',
      roles: ['admin']
    })
  }

  return items
})

// 🔧 工具函数
const getRoleDisplayText = (roleString?: string): string => {
  if (!roleString) return '访客'
  
  const roles = authStore.parseRoles(roleString)
  const roleLabels = {
    admin: '管理员',
    developer: '开发者',
    guest: '访客'
  }
  
  return roles.map(role => roleLabels[role] || role).join('、')
}

// 方法
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleTheme = () => {
  const newTheme = isDarkMode.value ? 'light' : 'dark'
  appStore.setTheme(newTheme)
}

const handleLogout = async () => {
  try {
    closeDropdown() // 关闭下拉菜单
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>
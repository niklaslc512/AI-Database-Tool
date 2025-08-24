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
        <div class="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
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
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <el-icon class="w-5 h-5 mr-3">
              <component :is="item.icon" />
            </el-icon>
            {{ item.title }}
          </router-link>
        </nav>

        <!-- 用户信息 -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <el-icon class="w-4 h-4 text-gray-600 dark:text-gray-400">
                <User />
              </el-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ user?.username || '用户' }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ user?.role || 'user' }}
              </div>
            </div>
            <el-dropdown trigger="click">
              <el-icon class="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer">
                <More />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">
                    <el-icon class="mr-2"><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区域 -->
    <div :class="['lg:ml-64 transition-all duration-300 ease-in-out']">
      <!-- 顶部导航栏 -->
      <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- 移动端菜单按钮 -->
            <button
              @click="toggleSidebar"
              class="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <el-icon class="w-5 h-5">
                <Menu />
              </el-icon>
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
                    <el-icon class="w-4 h-4 mx-2 text-gray-400">
                      <ArrowRight />
                    </el-icon>
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
              <el-icon class="w-5 h-5">
                <Sunny v-if="isDarkMode" />
                <Moon v-else />
              </el-icon>
            </button>

            <!-- 通知 -->
            <button class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 relative">
              <el-icon class="w-5 h-5">
                <Bell />
              </el-icon>
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="p-6">
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import {
  Grid,
  Connection,
  Search,
  ChatLineRound,
  Setting,
  User,
  More,
  Menu,
  ArrowRight,
  Sunny,
  Moon,
  Bell,
  SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

// 计算属性
const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const isDarkMode = computed(() => appStore.isDarkMode)
const user = computed(() => authStore.user)

const currentPageTitle = computed(() => {
  return route.meta?.title as string
})

// 菜单项
const menuItems = [
  { path: '/app/dashboard', title: '仪表板', icon: 'Grid' },
  { path: '/app/connections', title: '数据库连接', icon: 'Connection' },
  { path: '/app/query', title: '查询工作台', icon: 'Search' },
  { path: '/app/ai-assistant', title: 'AI助手', icon: 'ChatLineRound' },
  { path: '/app/settings', title: '设置', icon: 'Setting' }
]

// 方法
const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const toggleTheme = () => {
  const newTheme = isDarkMode.value ? 'light' : 'dark'
  appStore.setTheme(newTheme)
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}
</script>
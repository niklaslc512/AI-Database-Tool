<template>
  <div class="space-y-8">
    <!-- 页面标题 -->
    <div class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">仪表板</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">欢迎使用AI数据库管理系统</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div class="card-body p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <el-icon class="w-6 h-6 text-blue-600 dark:text-blue-400">
                  <Connection />
                </el-icon>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">数据库连接</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.connections }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div class="card-body p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                <el-icon class="w-6 h-6 text-green-600 dark:text-green-400">
                  <Search />
                </el-icon>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">今日查询</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.todayQueries }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div class="card-body p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                <el-icon class="w-6 h-6 text-purple-600 dark:text-purple-400">
                  <ChatLineRound />
                </el-icon>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">AI查询</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.aiQueries }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div class="card-body p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                <el-icon class="w-6 h-6 text-orange-600 dark:text-orange-400">
                  <Timer />
                </el-icon>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">平均响应时间</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.avgResponseTime }}ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="card bg-base-100 shadow-lg">
        <div class="card-header border-b border-gray-200 dark:border-gray-700 pb-4 px-6 pt-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">快捷操作</h3>
        </div>
        <div class="card-body p-6 space-y-3">
          <router-link
            to="/connections"
            class="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
          >
            <el-icon class="w-6 h-6 text-blue-600 dark:text-blue-400 mr-4">
              <Plus />
            </el-icon>
            <span class="text-gray-900 dark:text-white font-medium">添加数据库连接</span>
          </router-link>

          <router-link
            to="/query"
            class="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
          >
            <el-icon class="w-6 h-6 text-green-600 dark:text-green-400 mr-4">
              <Search />
            </el-icon>
            <span class="text-gray-900 dark:text-white font-medium">开始查询</span>
          </router-link>

          <router-link
            to="/ai-assistant"
            class="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
          >
            <el-icon class="w-6 h-6 text-purple-600 dark:text-purple-400 mr-4">
              <ChatLineRound />
            </el-icon>
            <span class="text-gray-900 dark:text-white font-medium">AI助手</span>
          </router-link>
        </div>
      </div>

      <div class="card bg-base-100 shadow-lg">
        <div class="card-header border-b border-gray-200 dark:border-gray-700 pb-4 px-6 pt-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">最近查询</h3>
        </div>
        <div class="card-body p-6">
          <div v-if="recentQueries.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-12">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <el-icon class="w-8 h-8 text-gray-400">
                <Search />
              </el-icon>
            </div>
            <p class="text-lg font-medium mb-2">暂无查询记录</p>
            <p class="text-sm">开始您的第一次查询吧</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="query in recentQueries"
              :key="query.id"
              class="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl hover:shadow-md transition-all duration-300"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                  {{ query.naturalQuery || query.sql }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTime(query.createdAt) }}
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                    query.success
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  ]"
                >
                  {{ query.success ? '成功' : '失败' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Connection, Search, ChatLineRound, Timer, Plus } from '@/utils/iconMapping'
import type { QueryHistory } from '@/types'

// 响应式数据
const stats = ref({
  connections: 0,
  todayQueries: 0,
  aiQueries: 0,
  avgResponseTime: 0
})

const recentQueries = ref<QueryHistory[]>([])

// 方法
const loadDashboardData = async () => {
  try {
    // TODO: 从API加载实际数据
    stats.value = {
      connections: 3,
      todayQueries: 24,
      aiQueries: 12,
      avgResponseTime: 156
    }

    recentQueries.value = []
  } catch (error) {
    console.error('加载仪表板数据失败:', error)
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) {
    return '刚刚'
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟前`
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 生命周期
onMounted(() => {
  loadDashboardData()
})
</script>
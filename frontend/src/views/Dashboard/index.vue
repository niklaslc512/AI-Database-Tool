<template>
  <div class=" flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 overflow-hidden">
    <!-- 📊 页面头部 -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-gray-200 flex-shrink-0 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">仪表板</h1>
          <p class="text-gray-600 mt-2">欢迎使用AI数据库管理系统</p>
        </div>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="bg-white/70 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">数据库连接</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.connections }}</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Connection class="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">今日查询</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.todayQueries }}</p>
            </div>
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Search class="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">AI查询</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.aiQueries }}</p>
            </div>
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ChatLineRound class="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div class="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">平均响应时间</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.avgResponseTime }}ms</p>
            </div>
            <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Timer class="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden min-h-0">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-0 flex-1 min-h-0">
        <div class="bg-white flex flex-col border-r border-gray-200">
          <div class="border-b border-gray-200 p-6 flex-shrink-0">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-gray-900">快捷操作</h3>
            </div>
          </div>
          <div class="p-6 space-y-3 flex-1 overflow-y-auto">
            <router-link
              to="/connections"
              class="flex items-center p-4 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
            >
              <Plus class="w-6 h-6 text-blue-600 mr-4" />
              <span class="text-gray-900 font-medium">添加数据库连接</span>
            </router-link>

            <router-link
              to="/query"
              class="flex items-center p-4 from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
            >
              <Search class="w-6 h-6 text-green-600 mr-4" />
              <span class="text-gray-900 font-medium">开始查询</span>
            </router-link>

            <router-link
              to="/ai-assistant"
              class="flex items-center p-4 from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
            >
              <ChatLineRound class="w-6 h-6 text-purple-600 mr-4" />
              <span class="text-gray-900 font-medium">AI助手</span>
            </router-link>
          </div>
        </div>

        <div class="bg-white flex flex-col">
          <div class="border-b border-gray-200 p-6 flex-shrink-0">
            <h3 class="text-xl font-bold text-gray-900">最近查询</h3>
          </div>
          <div class="p-6 flex-1 overflow-y-auto">
            <div v-if="recentQueries.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-12">
              <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Search class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-lg font-medium mb-2">暂无查询记录</p>
              <p class="text-sm">开始您的第一次查询吧</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="query in recentQueries"
                :key="query.id"
                class="flex items-center justify-between p-4 from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 hover:shadow-md transition-all duration-300"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                    {{ query.naturalQuery || query.sql }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatTime(query.createdAt) }}
                  </p>
                </div>
                <div class="flex items-center space-x-2 ml-auto">
                  <span
                    :class="[
                      'inline-flex items-center px-3 py-1 text-xs font-semibold',
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
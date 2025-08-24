<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">仪表板</h1>
      <p class="text-gray-600 dark:text-gray-400">欢迎使用AI数据库管理系统</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <el-icon class="w-5 h-5 text-blue-600 dark:text-blue-400">
                  <Connection />
                </el-icon>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">数据库连接</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.connections }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <el-icon class="w-5 h-5 text-green-600 dark:text-green-400">
                  <Search />
                </el-icon>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">今日查询</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.todayQueries }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <el-icon class="w-5 h-5 text-purple-600 dark:text-purple-400">
                  <ChatLineRound />
                </el-icon>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">AI查询</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.aiQueries }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <el-icon class="w-5 h-5 text-orange-600 dark:text-orange-400">
                  <Timer />
                </el-icon>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">平均响应时间</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.avgResponseTime }}ms</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">快捷操作</h3>
        </div>
        <div class="card-body space-y-4">
          <router-link
            to="/connections"
            class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <el-icon class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3">
              <Plus />
            </el-icon>
            <span class="text-gray-900 dark:text-white">添加数据库连接</span>
          </router-link>

          <router-link
            to="/query"
            class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <el-icon class="w-5 h-5 text-green-600 dark:text-green-400 mr-3">
              <Search />
            </el-icon>
            <span class="text-gray-900 dark:text-white">开始查询</span>
          </router-link>

          <router-link
            to="/ai-assistant"
            class="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <el-icon class="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3">
              <ChatLineRound />
            </el-icon>
            <span class="text-gray-900 dark:text-white">AI助手</span>
          </router-link>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">最近查询</h3>
        </div>
        <div class="card-body">
          <div v-if="recentQueries.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-8">
            暂无查询记录
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="query in recentQueries"
              :key="query.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ query.naturalQuery || query.sql }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTime(query.createdAt) }}
                </p>
              </div>
              <div class="flex items-center space-x-2">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
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
import { Connection, Search, ChatLineRound, Timer, Plus } from '@element-plus/icons-vue'
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
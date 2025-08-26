<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">查询工作台</h1>
      <p class="text-gray-600 dark:text-gray-400">执行SQL查询和数据分析</p>
    </div>

    <div class="card">
      <div class="card-body text-center py-12">
        <el-icon class="w-16 h-16 text-gray-400 mx-auto mb-4">
          <Search />
        </el-icon>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          查询工作台
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          此功能正在开发中，敬请期待
        </p>
        <el-button type="primary">开始查询</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@/utils/iconMapping'
</script>
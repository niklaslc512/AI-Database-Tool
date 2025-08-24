<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">AI助手</h1>
      <p class="text-gray-600 dark:text-gray-400">智能数据库查询和管理助手</p>
    </div>

    <div class="card">
      <div class="card-body text-center py-12">
        <el-icon class="w-16 h-16 text-gray-400 mx-auto mb-4">
          <ChatLineRound />
        </el-icon>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          AI智能助手
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          此功能正在开发中，敬请期待
        </p>
        <el-button type="primary">开始对话</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatLineRound } from '@element-plus/icons-vue'
</script>
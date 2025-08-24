<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-xl">AI</span>
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          创建新账户
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          AI数据库管理系统
        </p>
      </div>

      <div class="card">
        <div class="card-body text-center py-12">
          <el-icon class="w-16 h-16 text-gray-400 mx-auto mb-4">
            <UserFilled />
          </el-icon>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            用户注册
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            此功能正在开发中，敬请期待
          </p>
          <router-link to="/login">
            <el-button type="primary">返回登录</el-button>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserFilled } from '@element-plus/icons-vue'
</script>
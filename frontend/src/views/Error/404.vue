<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <div class="space-y-8">
        <!-- 404图标 -->
        <div>
          <h1 class="text-9xl font-bold text-gray-300 dark:text-gray-600">404</h1>
          <div class="relative -mt-8">
            <QuestionFilled class="w-16 h-16 text-gray-400 mx-auto" />
          </div>
        </div>

        <!-- 错误信息 -->
        <div class="space-y-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            页面未找到
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            抱歉，您访问的页面不存在或已被删除。
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="space-y-4">
          <button class="btn btn-primary btn-lg" @click="goHome">
            返回首页
          </button>
          <div>
            <button class="btn btn-ghost" @click="goBack">
              返回上一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { QuestionFilled } from '@/utils/iconMapping'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>
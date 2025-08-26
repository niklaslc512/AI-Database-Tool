<template>
  <div v-if="hasPermission">
    <!-- ✅ 有权限时显示内容 -->
    <slot />
  </div>
  <div v-else-if="showFallback" class="permission-denied">
    <!-- ❌ 无权限时显示的内容 -->
    <slot name="fallback">
      <div class="flex flex-col items-center justify-center p-8 text-center">
        <el-icon class="w-16 h-16 text-gray-400 mb-4">
          <Lock />
        </el-icon>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          🚫 权限不足
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          您没有访问此内容的权限，请联系管理员获取相应权限。
        </p>
        <el-button type="primary" @click="goBack">
          返回上一页
        </el-button>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Lock } from '@/utils/iconMapping'
import type { UserRole } from '@/types'

interface Props {
  /** 🔐 需要的权限 */
  permission?: string
  /** 👥 需要的角色（任一匹配即可） */
  roles?: UserRole[]
  /** 👥 需要的角色（全部匹配） */
  requireAllRoles?: UserRole[]
  /** 🎭 是否显示无权限时的回退内容 */
  showFallback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showFallback: true
})

const router = useRouter()
const authStore = useAuthStore()

// 🔐 权限检查
const hasPermission = computed(() => {
  // 检查具体权限
  if (props.permission) {
    const permissionCheck = authStore.checkUserPermission(props.permission)
    if (!permissionCheck) {
      console.warn(`🚫 组件权限检查失败: ${props.permission}`)
      return false
    }
  }
  
  // 检查角色权限（任一匹配）
  if (props.roles && props.roles.length > 0) {
    const roleCheck = authStore.checkUserRoles(props.roles)
    if (!roleCheck) {
      console.warn(`🚫 组件角色检查失败: ${props.roles.join(', ')}`)
      return false
    }
  }
  
  // 检查角色权限（全部匹配）
  if (props.requireAllRoles && props.requireAllRoles.length > 0) {
    const allRolesCheck = props.requireAllRoles.every(role => 
      authStore.checkUserRole(role)
    )
    if (!allRolesCheck) {
      console.warn(`🚫 组件全角色检查失败: ${props.requireAllRoles.join(', ')}`)
      return false
    }
  }
  
  return true
})

// 🔙 返回上一页
const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/app/dashboard')
  }
}
</script>

<style scoped>
.permission-denied {
  min-height: 200px;
}
</style>
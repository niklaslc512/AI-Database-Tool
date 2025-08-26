<template>
  <div class="permission-test">
    <!-- 📊 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">
        <el-icon class="title-icon"><Lock /></el-icon>
        权限测试页面
      </h1>
      <p class="page-description">测试不同角色和权限的访问控制效果</p>
    </div>

    <!-- 🔐 当前用户信息 -->
    <el-card class="user-info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>👤 当前用户信息</span>
        </div>
      </template>
      <div class="user-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">{{ user?.username || '未登录' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ user?.email || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag v-for="role in userRoles" :key="role" :type="getRoleTagType(role)" class="mr-1">
              {{ getRoleLabel(role) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="认证状态">
            <el-tag :type="isAuthenticated ? 'success' : 'danger'">
              {{ isAuthenticated ? '✅ 已认证' : '❌ 未认证' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 🛡️ 权限指令测试 -->
    <el-card class="test-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>🛡️ 权限指令测试</span>
          <el-text type="info" size="small">使用 v-permission 指令控制元素显示</el-text>
        </div>
      </template>
      
      <div class="test-section">
        <h3>🔐 基于权限的按钮控制</h3>
        <div class="button-group">
          <el-button 
            type="primary" 
            v-permission="{ permission: 'user:create' }"
          >
            创建用户 (需要 user:create 权限)
          </el-button>
          
          <el-button 
            type="warning" 
            v-permission="{ permission: 'user:update' }"
          >
            编辑用户 (需要 user:update 权限)
          </el-button>
          
          <el-button 
            type="danger" 
            v-permission="{ permission: 'user:delete' }"
          >
            删除用户 (需要 user:delete 权限)
          </el-button>
          
          <el-button 
            type="success" 
            v-permission="{ permission: 'system:settings' }"
          >
            系统设置 (需要 system:settings 权限)
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>👥 基于角色的内容控制</h3>
        <div class="role-content">
          <el-alert 
            title="管理员专用内容" 
            type="error" 
            :closable="false"
            v-permission="{ roles: ['admin'] }"
          >
            只有管理员才能看到这个警告信息
          </el-alert>
          
          <el-alert 
            title="开发者专用内容" 
            type="warning" 
            :closable="false"
            v-permission="{ roles: ['developer'] }"
          >
            只有开发者才能看到这个警告信息
          </el-alert>
          
          <el-alert 
            title="访客可见内容" 
            type="info" 
            :closable="false"
            v-permission="{ roles: ['guest'] }"
          >
            访客用户可以看到这个信息
          </el-alert>
          
          <el-alert 
            title="管理员和开发者可见" 
            type="success" 
            :closable="false"
            v-permission="{ roles: ['admin', 'developer'] }"
          >
            管理员和开发者都可以看到这个信息
          </el-alert>
        </div>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>🔒 权限不足时禁用而非隐藏</h3>
        <div class="button-group">
          <el-button 
            type="primary" 
            v-permission="{ permission: 'user:create', action: 'disable' }"
          >
            创建用户 (权限不足时禁用)
          </el-button>
          
          <el-button 
            type="danger" 
            v-permission="{ permission: 'system:delete', action: 'disable' }"
          >
            系统删除 (权限不足时禁用)
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 🧩 权限组件测试 -->
    <el-card class="test-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>🧩 权限组件测试</span>
          <el-text type="info" size="small">使用 PermissionGuard 组件控制内容显示</el-text>
        </div>
      </template>
      
      <div class="test-section">
        <h3>🔐 基于权限的组件保护</h3>
        
        <PermissionGuard permission="user:management">
          <el-card class="protected-content" shadow="hover">
            <h4>👥 用户管理模块</h4>
            <p>这个模块需要 user:management 权限才能访问</p>
            <el-button type="primary">进入用户管理</el-button>
          </el-card>
        </PermissionGuard>
        
        <PermissionGuard permission="database:management">
          <el-card class="protected-content" shadow="hover">
            <h4>🗄️ 数据库管理模块</h4>
            <p>这个模块需要 database:management 权限才能访问</p>
            <el-button type="primary">进入数据库管理</el-button>
          </el-card>
        </PermissionGuard>
        
        <PermissionGuard :roles="['admin']">
          <el-card class="protected-content" shadow="hover">
            <h4>⚙️ 系统设置模块</h4>
            <p>这个模块只有管理员才能访问</p>
            <el-button type="primary">进入系统设置</el-button>
          </el-card>
        </PermissionGuard>
      </div>

      <el-divider />

      <div class="test-section">
        <h3>🚫 权限不足时的自定义回退内容</h3>
        
        <PermissionGuard permission="super:admin">
          <el-card class="protected-content" shadow="hover">
            <h4>🔥 超级管理员功能</h4>
            <p>这是超级管理员专用功能</p>
            <el-button type="danger">危险操作</el-button>
          </el-card>
          
          <template #fallback>
            <el-card class="fallback-content" shadow="hover">
              <div class="text-center">
                <el-icon class="fallback-icon"><Lock /></el-icon>
                <h4>🚫 权限不足</h4>
                <p>您需要超级管理员权限才能访问此功能</p>
                <el-button type="primary" @click="requestPermission">申请权限</el-button>
              </div>
            </el-card>
          </template>
        </PermissionGuard>
      </div>
    </el-card>

    <!-- 📊 权限检查结果 -->
    <el-card class="test-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>📊 权限检查结果</span>
          <el-text type="info" size="small">显示当前用户的权限检查结果</el-text>
        </div>
      </template>
      
      <div class="permission-results">
        <el-table :data="permissionTests" stripe>
          <el-table-column prop="name" label="权限/角色" width="200" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'permission' ? 'primary' : 'success'" size="small">
                {{ row.type === 'permission' ? '权限' : '角色' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="result" label="检查结果" width="120">
            <template #default="{ row }">
              <el-tag :type="row.result ? 'success' : 'danger'" size="small">
                {{ row.result ? '✅ 通过' : '❌ 拒绝' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// 🎨 使用原生浏览器API替代Element Plus消息组件
import { Lock } from '@/utils/iconMapping'
import { useAuthStore } from '@/stores/auth'
import PermissionGuard from '@/components/Common/PermissionGuard.vue'
import { hasPermission, hasRole, isAuthenticated } from '@/utils/permission'
import type { UserRole } from '@/types'

const authStore = useAuthStore()

// 🔐 用户信息
const user = computed(() => authStore.user)
const userRoles = computed(() => {
  if (!user.value?.role) return []
  return authStore.parseRoles(user.value.role)
})

// 🎭 角色标签类型
const getRoleTagType = (role: UserRole) => {
  const typeMap = {
    admin: 'danger',
    developer: 'warning', 
    guest: 'info'
  }
  return typeMap[role] || 'info'
}

// 🏷️ 角色标签文本
const getRoleLabel = (role: UserRole) => {
  const labelMap = {
    admin: '管理员',
    developer: '开发者',
    guest: '访客'
  }
  return labelMap[role] || role
}

// 📊 权限测试结果
const permissionTests = computed(() => [
  {
    name: 'user:create',
    type: 'permission',
    result: hasPermission('user:create'),
    description: '创建用户权限'
  },
  {
    name: 'user:update',
    type: 'permission',
    result: hasPermission('user:update'),
    description: '编辑用户权限'
  },
  {
    name: 'user:delete',
    type: 'permission',
    result: hasPermission('user:delete'),
    description: '删除用户权限'
  },
  {
    name: 'system:settings',
    type: 'permission',
    result: hasPermission('system:settings'),
    description: '系统设置权限'
  },
  {
    name: 'database:management',
    type: 'permission',
    result: hasPermission('database:management'),
    description: '数据库管理权限'
  },
  {
    name: 'admin',
    type: 'role',
    result: hasRole('admin'),
    description: '管理员角色'
  },
  {
    name: 'developer',
    type: 'role',
    result: hasRole('developer'),
    description: '开发者角色'
  },
  {
    name: 'guest',
    type: 'role',
    result: hasRole('guest'),
    description: '访客角色'
  }
])

// 🔄 申请权限
const requestPermission = () => {
  ElMessage.info('权限申请功能暂未实现，请联系管理员')
}
</script>

<style scoped>
.permission-test {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.title-icon {
  margin-right: 8px;
  color: #409eff;
}

.page-description {
  color: #606266;
  margin: 0;
}

.user-info-card,
.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-section {
  margin-bottom: 20px;
}

.test-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.role-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.protected-content {
  margin-bottom: 16px;
}

.protected-content h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.protected-content p {
  margin: 0 0 12px 0;
  color: #606266;
}

.fallback-content {
  margin-bottom: 16px;
  border: 2px dashed #dcdfe6;
}

.fallback-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.permission-results {
  margin-top: 16px;
}

.mr-1 {
  margin-right: 4px;
}

.text-center {
  text-align: center;
}
</style>
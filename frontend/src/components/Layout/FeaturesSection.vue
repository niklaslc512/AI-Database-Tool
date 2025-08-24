<template>
  <section id="features" class="features-section">
    <div class="features-container">
      <!-- 区域标题 -->
      <div class="section-header">
        <div class="section-badge">
          <span class="badge-icon">⚡</span>
          <span>强大功能</span>
        </div>
        <h2 class="section-title">
          全方位的数据库管理解决方案
        </h2>
        <p class="section-subtitle">
          从自然语言查询到智能优化，从权限管控到审计追踪，
          <br class="hidden sm:block">
          为您提供专业、安全、高效的数据库管理体验
        </p>
      </div>
      
      <!-- 功能网格 -->
      <div class="features-grid">
        <div 
          v-for="(feature, index) in features" 
          :key="feature.id"
          class="feature-card"
          :class="{ 'featured': feature.featured }"
          :style="{ '--delay': index * 0.1 + 's' }"
        >
          <div class="feature-icon-wrapper">
            <div class="feature-icon" :class="feature.iconClass">
              <component :is="feature.icon" class="w-6 h-6" />
            </div>
          </div>
          
          <div class="feature-content">
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
            
            <!-- 功能亮点 -->
            <ul class="feature-highlights" v-if="feature.highlights">
              <li v-for="highlight in feature.highlights" :key="highlight" class="highlight-item">
                <svg class="highlight-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ highlight }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'

// 定义图标组件
const ChatIcon = defineComponent({
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    xmlns: 'http://www.w3.org/2000/svg'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
    })
  ])
})

const DatabaseIcon = defineComponent({
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, [
    h('ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' }),
    h('path', { d: 'M21 12c0 1.66-4 3-9 3s-9-1.34-9-3' }),
    h('path', { d: 'M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5' })
  ])
})

const LightningIcon = defineComponent({
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M13 10V3L4 14h7v7l9-11h-7z'
    })
  ])
})

const ChartIcon = defineComponent({
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    })
  ])
})

const ShieldIcon = defineComponent({
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    })
  ])
})

const ClipboardIcon = defineComponent({
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
    })
  ])
})

// 功能特性数据
const features = [
  {
    id: 1,
    title: '自然语言查询',
    description: '用自然语言描述您的需求，AI自动生成精确的SQL查询语句，让数据查询变得简单直观。',
    icon: ChatIcon,
    iconClass: 'bg-blue-500',
    featured: true,
    highlights: [
      '智能语言理解',
      'SQL自动生成',
      '语法错误检查'
    ]
  },
  {
    id: 2,
    title: '多数据库支持',
    description: '完美支持MySQL、PostgreSQL、SQLite、MongoDB等主流数据库，一个平台管理所有数据源。',
    icon: DatabaseIcon,
    iconClass: 'bg-green-500',
    highlights: [
      'MySQL & PostgreSQL',
      'MongoDB & SQLite',
      '统一管理界面'
    ]
  },
  {
    id: 3,
    title: '智能优化建议',
    description: 'AI分析您的查询模式，提供索引建议、查询优化方案，显著提升数据库性能。',
    icon: LightningIcon,
    iconClass: 'bg-yellow-500',
    featured: true,
    highlights: [
      '性能分析',
      '索引建议',
      '查询优化'
    ]
  },
  {
    id: 4,
    title: '可视化分析',
    description: '查询结果自动生成图表，支持多种可视化类型，让数据洞察一目了然。',
    icon: ChartIcon,
    iconClass: 'bg-purple-500',
    highlights: [
      '自动图表生成',
      '多种图表类型',
      '交互式分析'
    ]
  },
  {
    id: 5,
    title: '权限管控',
    description: '细粒度的用户权限管理，支持角色分配、操作授权，确保数据安全访问。',
    icon: ShieldIcon,
    iconClass: 'bg-red-500',
    highlights: [
      '用户角色管理',
      '细粒度权限',
      '操作审核'
    ]
  },
  {
    id: 6,
    title: '审计日志',
    description: '完整记录所有操作日志，支持审计追踪和合规检查，保障数据安全合规。',
    icon: ClipboardIcon,
    iconClass: 'bg-indigo-500',
    highlights: [
      '操作记录',
      '审计追踪',
      '合规检查'
    ]
  }
]
</script>

<style scoped>
@reference "@/styles/main.css";
.features-section {
  @apply py-20 lg:py-32;
  @apply bg-white dark:bg-gray-900;
}

.features-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.section-header {
  @apply text-center max-w-3xl mx-auto mb-16 lg:mb-20;
}

.section-badge {
  @apply inline-flex items-center space-x-2 px-4 py-2 mb-6;
  @apply bg-primary-50 dark:bg-primary-900/30 rounded-full;
  @apply text-primary-600 dark:text-primary-400 text-sm font-medium;
  @apply border border-primary-200 dark:border-primary-800;
}

.badge-icon {
  @apply text-base;
}

.section-title {
  @apply text-3xl sm:text-4xl lg:text-5xl font-bold;
  @apply text-gray-900 dark:text-white mb-6;
  @apply tracking-tight leading-tight;
}

.section-subtitle {
  @apply text-lg sm:text-xl text-gray-600 dark:text-gray-300;
  @apply leading-relaxed;
}

.features-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10;
}

.feature-card {
  @apply relative p-8 rounded-2xl;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  @apply shadow-soft hover:shadow-medium;
  @apply transition-all duration-300 ease-out;
  @apply transform hover:-translate-y-2;
  animation: fadeInUp 0.6s ease-out;
  animation-delay: var(--delay);
  animation-fill-mode: both;
}

.feature-card.featured {
  @apply border-primary-200 dark:border-primary-800;
  @apply bg-gradient-to-br from-primary-50/50 to-white;
  @apply dark:from-primary-900/20 dark:to-gray-800;
}

.feature-card:hover {
  @apply border-primary-300 dark:border-primary-600;
}

.feature-icon-wrapper {
  @apply mb-6;
}

.feature-icon {
  @apply w-12 h-12 rounded-xl flex items-center justify-center;
  @apply text-white shadow-lg;
  @apply transform transition-transform duration-300;
}

.feature-card:hover .feature-icon {
  @apply scale-110;
}

.feature-content {
  @apply space-y-4;
}

.feature-title {
  @apply text-xl font-bold text-gray-900 dark:text-white;
  @apply mb-3;
}

.feature-description {
  @apply text-gray-600 dark:text-gray-300 leading-relaxed;
  @apply mb-4;
}

.feature-highlights {
  @apply space-y-2;
}

.highlight-item {
  @apply flex items-center space-x-2 text-sm;
  @apply text-gray-500 dark:text-gray-400;
}

.highlight-icon {
  @apply w-4 h-4 text-primary-500 dark:text-primary-400;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .features-grid {
    @apply grid-cols-1 gap-6;
  }
  
  .feature-card {
    @apply p-6;
  }
}
</style>
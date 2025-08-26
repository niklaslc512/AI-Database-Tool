<template>
  <div class="home-page">
    <!-- 导航栏 -->
    <MainNavbar />
    
    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 英雄区域 -->
      <HeroSection />
      
      <!-- 功能特性 -->
      <FeaturesSection />
      
      <!-- 产品演示区域 -->
      <section id="demo" class="demo-section">
        <div class="demo-container">
          <div class="section-header">
            <div class="section-badge">
              <span class="badge-icon">🚀</span>
              <span>产品演示</span>
            </div>
            <h2 class="section-title">
              体验AI驱动的数据库管理
            </h2>
            <p class="section-subtitle">
              观看产品演示，了解如何通过自然语言轻松管理数据库
            </p>
          </div>
          
          <div class="demo-content">
            <!-- 演示视频或截图 -->
            <div class="demo-video-wrapper">
              <div class="demo-placeholder">
                <div class="play-button" @click="handlePlayDemo">
                  <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div class="demo-overlay">
                  <h3 class="demo-title">产品演示视频</h3>
                  <p class="demo-description">3分钟了解完整功能</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- 技术优势区域 -->
      <section id="advantages" class="advantages-section">
        <div class="advantages-container">
          <div class="section-header">
            <div class="section-badge">
              <span class="badge-icon">⚙️</span>
              <span>技术优势</span>
            </div>
            <h2 class="section-title">
              为什么选择我们的解决方案
            </h2>
          </div>
          
          <div class="advantages-grid">
            <div v-for="(advantage, index) in advantages" :key="index" class="advantage-card">
              <div class="advantage-icon">
                <component :is="advantage.icon" class="w-8 h-8" />
              </div>
              <h3 class="advantage-title">{{ advantage.title }}</h3>
              <p class="advantage-description">{{ advantage.description }}</p>
              <div class="advantage-stats" v-if="advantage.stats">
                <div class="stat-item" v-for="stat in advantage.stats" :key="stat.label">
                  <div class="stat-value">{{ stat.value }}</div>
                  <div class="stat-label">{{ stat.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- CTA区域 -->
      <section class="cta-section">
        <div class="cta-container">
          <div class="cta-content">
            <h2 class="cta-title">
              准备开始您的智能数据库管理之旅？
            </h2>
            <p class="cta-subtitle">
              加入成千上万的开发者，体验AI驱动的数据库管理平台
            </p>
            <div class="cta-actions">
              <BaseButton variant="primary" size="xl" @click="handleGetStarted">
                免费开始使用
              </BaseButton>
              <BaseButton variant="outline" size="xl" @click="handleContactUs">
                联系我们
              </BaseButton>
            </div>
          </div>
        </div>
      </section>
    </main>
    
    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="footer-logo">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <span class="footer-text">AI数据库管理</span>
            </div>
            <p class="footer-description">
              让数据库管理变得简单智能
            </p>
          </div>
          
          <div class="footer-links">
            <div class="link-group">
              <h3 class="link-title">产品</h3>
              <ul class="link-list">
                <li><a href="#features" class="link">功能特性</a></li>
                <li><a href="#demo" class="link">产品演示</a></li>
                <li><a href="#" class="link">价格方案</a></li>
              </ul>
            </div>
            
            <div class="link-group">
              <h3 class="link-title">支持</h3>
              <ul class="link-list">
                <li><a href="#" class="link">帮助文档</a></li>
                <li><a href="#" class="link">API文档</a></li>
                <li><a href="#" class="link">社区论坛</a></li>
              </ul>
            </div>
            
            <div class="link-group">
              <h3 class="link-title">公司</h3>
              <ul class="link-list">
                <li><a href="#" class="link">关于我们</a></li>
                <li><a href="#" class="link">联系我们</a></li>
                <li><a href="#" class="link">隐私政策</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="copyright">
            © 2024 AI数据库管理系统. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'
import MainNavbar from '@/components/Layout/MainNavbar.vue'
import HeroSection from '@/components/Layout/HeroSection.vue'
import FeaturesSection from '@/components/Layout/FeaturesSection.vue'
import BaseButton from '@/components/UI/BaseButton.vue'

const router = useRouter()
const themeStore = useThemeStore()

// 定义图标组件
const PerformanceIcon = defineComponent({
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

const SecurityIcon = defineComponent({
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

const ScalabilityIcon = defineComponent({
  render: () => h('svg', {
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
    })
  ])
})

// 技术优势数据
const advantages = [
  {
    title: '卓越性能',
    description: '基于最新的AI技术和优化算法，提供毫秒级响应速度，处理海量数据毫不费力。',
    icon: PerformanceIcon,
    stats: [
      { value: '< 100ms', label: '查询响应时间' },
      { value: '99.9%', label: '系统可用性' }
    ]
  },
  {
    title: '企业级安全',
    description: '采用业界领先的安全标准，多层防护机制，确保您的数据安全无忧。',
    icon: SecurityIcon,
    stats: [
      { value: 'AES-256', label: '数据加密' },
      { value: 'SOC 2', label: '安全认证' }
    ]
  },
  {
    title: '弹性扩展',
    description: '云原生架构设计，支持水平扩展，轻松应对业务增长和流量高峰。',
    icon: ScalabilityIcon,
    stats: [
      { value: '10TB+', label: '数据处理能力' },
      { value: '自动', label: '扩容机制' }
    ]
  }
]

// 事件处理
const handlePlayDemo = () => {
  // 这里可以打开演示视频或跳转到演示页面
  console.log('播放演示视频')
}

const handleGetStarted = () => {
  router.push('/login')
}

const handleContactUs = () => {
  // 这里可以打开联系我们的模态框或跳转到联系页面
  console.log('联系我们')
}

// 生命周期
onMounted(() => {
  // 初始化主题
  themeStore.initTheme()
})
</script>

<style scoped>
@reference "@/styles/main.css";

.home-page {
  @apply min-h-screen bg-white dark:bg-black;
}

.main-content {
  @apply relative;
}

/* 演示区域样式 */
.demo-section {
  @apply py-20 lg:py-32 bg-green-50 dark:bg-green-950;
}

.demo-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.section-header {
  @apply text-center max-w-3xl mx-auto mb-16;
}

.section-badge {
  @apply inline-flex items-center space-x-2 px-4 py-2 mb-6;
  @apply bg-green-50 dark:bg-green-900/30 rounded-full;
  @apply text-green-600 dark:text-green-400 text-sm font-medium;
  @apply border border-green-200 dark:border-green-800;
}

.badge-icon {
  @apply text-base;
}

.section-title {
  @apply text-3xl sm:text-4xl lg:text-5xl font-bold;
  @apply text-black dark:text-white mb-6;
  @apply tracking-tight leading-tight;
}

.section-subtitle {
  @apply text-lg sm:text-xl text-black dark:text-white;
  @apply leading-relaxed;
}

.demo-content {
  @apply max-w-4xl mx-auto;
}

.demo-video-wrapper {
  @apply relative rounded-2xl overflow-hidden shadow-2xl;
}

.demo-placeholder {
  @apply relative aspect-video bg-gradient-to-br from-black to-green-900;
  @apply flex items-center justify-center cursor-pointer;
  @apply hover:from-green-900 hover:to-black transition-all duration-300;
}

.play-button {
  @apply w-20 h-20 bg-green-500 rounded-full;
  @apply flex items-center justify-center text-white;
  @apply shadow-lg hover:shadow-xl transform hover:scale-110;
  @apply transition-all duration-300;
}

.demo-overlay {
  @apply absolute bottom-8 left-8 text-white;
}

.demo-title {
  @apply text-xl font-bold mb-2;
}

.demo-description {
  @apply text-gray-300;
}

/* 技术优势区域样式 */
.advantages-section {
  @apply py-20 lg:py-32 bg-white dark:bg-black;
}

.advantages-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.advantages-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12;
}

.advantage-card {
  @apply text-center p-8;
}

.advantage-icon {
  @apply w-16 h-16 mx-auto mb-6;
  @apply bg-green-100 dark:bg-green-900/30 rounded-2xl;
  @apply flex items-center justify-center;
  @apply text-green-600 dark:text-green-400;
}

.advantage-title {
  @apply text-xl font-bold text-black dark:text-white mb-4;
}

.advantage-description {
  @apply text-black dark:text-white mb-6 leading-relaxed;
}

.advantage-stats {
  @apply flex justify-center space-x-8;
}

.stat-item {
  @apply text-center;
}

.stat-value {
  @apply text-2xl font-bold text-green-600 dark:text-green-400;
}

.stat-label {
  @apply text-sm text-black dark:text-white mt-1;
}

/* CTA区域样式 */
.cta-section {
  @apply py-20 lg:py-32 bg-gradient-to-r from-green-500 to-green-600;
}

.cta-container {
  @apply max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center;
}

.cta-title {
  @apply text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6;
  @apply leading-tight;
}

.cta-subtitle {
  @apply text-xl text-green-100 mb-8 leading-relaxed;
}

.cta-actions {
  @apply flex flex-col sm:flex-row gap-4 justify-center;
}

/* 页脚样式 */
.footer {
  @apply bg-black text-white;
}

.footer-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12;
}

.footer-content {
  @apply grid grid-cols-1 md:grid-cols-4 gap-8 mb-8;
}

.footer-brand {
  @apply col-span-1 md:col-span-1;
}

.footer-logo {
  @apply flex items-center space-x-3 mb-4;
}

.footer-text {
  @apply text-xl font-bold text-white;
}

.footer-description {
  @apply text-white leading-relaxed;
}

.footer-links {
  @apply col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8;
}

.link-group {
  @apply space-y-4;
}

.link-title {
  @apply text-sm font-semibold text-white uppercase tracking-wider;
}

.link-list {
  @apply space-y-2;
}

.link {
  @apply text-white hover:text-green-400 transition-colors duration-200;
}

.footer-bottom {
  @apply pt-8 border-t border-green-800 text-center;
}

.copyright {
  @apply text-white;
}
</style>
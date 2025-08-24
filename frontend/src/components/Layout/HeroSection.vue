<template>
  <section class="hero-section">
    <div class="hero-container">
      <div class="hero-content">
        <!-- 文本内容 -->
        <div class="hero-text">
          <div class="hero-badge">
            <span class="badge-icon">✨</span>
            <span>AI驱动的智能数据库管理</span>
          </div>
          
          <h1 class="hero-title">
            让数据库管理变得
            <span class="text-gradient">智能简单</span>
          </h1>
          
          <p class="hero-subtitle">
            通过自然语言轻松管理数据库，支持多种数据库类型，
            <br class="hidden sm:block">
            AI助手帮您优化查询，让数据操作变得直观高效
          </p>
          
          <!-- 功能亮点 -->
          <div class="hero-features">
            <div class="feature-item" v-for="(feature, index) in features" :key="index">
              <div class="feature-icon">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>{{ feature }}</span>
            </div>
          </div>
          
          <!-- 行动按钮 -->
          <div class="hero-actions">
            <BaseButton 
              size="lg" 
              class="hero-cta-primary"
              @click="handleGetStarted"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              立即体验
            </BaseButton>
            <BaseButton 
              variant="ghost" 
              size="lg"
              @click="handleViewDemo"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              观看演示
            </BaseButton>
          </div>
        </div>
        
        <!-- 视觉展示 -->
        <div class="hero-visual">
          <div class="visual-container">
            <!-- 产品模拟界面 -->
            <div class="mock-window">
              <!-- 窗口标题栏 -->
              <div class="window-header">
                <div class="window-controls">
                  <div class="control red"></div>
                  <div class="control yellow"></div>
                  <div class="control green"></div>
                </div>
                <div class="window-title">AI数据库助手</div>
              </div>
              
              <!-- 窗口内容 -->
              <div class="window-content">
                <div class="code-editor">
                  <div class="editor-line">
                    <span class="line-number">1</span>
                    <span class="code-text">
                      <span class="text-blue-400">SELECT</span> 
                      <span class="text-white"> * </span>
                      <span class="text-blue-400">FROM</span> 
                      <span class="text-green-400"> users </span>
                      <span class="text-blue-400">WHERE</span>
                    </span>
                  </div>
                  <div class="editor-line">
                    <span class="line-number">2</span>
                    <span class="code-text text-gray-400">
                      -- AI正在为您优化查询...
                    </span>
                  </div>
                  <div class="ai-response">
                    <div class="ai-avatar">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364-.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div class="ai-message">
                      <div class="success-indicator">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>查询优化完成</span>
                      </div>
                      <div class="optimization-tip">
                        建议添加索引以提升查询性能
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 装饰性元素 -->
            <div class="floating-elements">
              <div class="floating-card" style="--delay: 0s">
                <div class="card-icon">📊</div>
                <div class="card-text">实时分析</div>
              </div>
              <div class="floating-card" style="--delay: 1s">
                <div class="card-icon">🚀</div>
                <div class="card-text">性能优化</div>
              </div>
              <div class="floating-card" style="--delay: 2s">
                <div class="card-icon">🛡️</div>
                <div class="card-text">安全可靠</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 背景装饰 -->
    <div class="hero-decoration">
      <div class="decoration-grid"></div>
      <div class="decoration-gradient"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '@/components/UI/BaseButton.vue'

const router = useRouter()

// 功能亮点
const features = [
  '自然语言查询',
  '多数据库支持',
  '智能优化建议'
]

// 事件处理
const handleGetStarted = () => {
  router.push('/login')
}

const handleViewDemo = () => {
  const demoSection = document.getElementById('demo')
  if (demoSection) {
    demoSection.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
@reference "@/styles/main.css";
.hero-section {
  @apply relative min-h-screen flex items-center;
  @apply bg-gradient-to-br from-gray-50 via-white to-gray-100;
  @apply dark:from-gray-900 dark:via-gray-900 dark:to-gray-800;
  @apply pt-16 overflow-hidden;
}

.hero-container {
  @apply relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20;
  @apply z-10;
}

.hero-content {
  @apply grid lg:grid-cols-2 gap-12 xl:gap-16 items-center;
}

.hero-text {
  @apply space-y-8;
}

.hero-badge {
  @apply inline-flex items-center space-x-2 px-4 py-2;
  @apply bg-primary-50 dark:bg-primary-900/30 rounded-full;
  @apply text-primary-600 dark:text-primary-400 text-sm font-medium;
  @apply border border-primary-200 dark:border-primary-800;
}

.badge-icon {
  @apply text-base;
}

.hero-title {
  @apply text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold;
  @apply text-gray-900 dark:text-white leading-tight;
  @apply tracking-tight;
}

.text-gradient {
  @apply bg-gradient-to-r from-primary-500 via-primary-600 to-emerald-600;
  @apply bg-clip-text text-transparent;
}

.hero-subtitle {
  @apply text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300;
  @apply leading-relaxed max-w-2xl;
}

.hero-features {
  @apply flex flex-wrap gap-4 sm:gap-6;
}

.feature-item {
  @apply flex items-center space-x-2 text-gray-700 dark:text-gray-300;
}

.feature-icon {
  @apply w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30;
  @apply flex items-center justify-center text-primary-600 dark:text-primary-400;
}

.hero-actions {
  @apply flex flex-col sm:flex-row gap-4;
}

.hero-cta-primary {
  @apply shadow-lg hover:shadow-xl;
  @apply bg-gradient-to-r from-primary-500 to-primary-600;
  @apply hover:from-primary-600 hover:to-primary-700;
}

.hero-visual {
  @apply relative;
}

.visual-container {
  @apply relative;
}

.mock-window {
  @apply bg-gray-900 rounded-xl shadow-2xl overflow-hidden;
  @apply border border-gray-700;
  @apply transform rotate-2 hover:rotate-1 transition-transform duration-500;
}

.window-header {
  @apply flex items-center justify-between px-4 py-3;
  @apply bg-gray-800 border-b border-gray-700;
}

.window-controls {
  @apply flex space-x-2;
}

.control {
  @apply w-3 h-3 rounded-full;
}

.control.red {
  @apply bg-red-500;
}

.control.yellow {
  @apply bg-yellow-500;
}

.control.green {
  @apply bg-green-500;
}

.window-title {
  @apply text-gray-300 text-sm font-medium;
}

.window-content {
  @apply p-4;
}

.code-editor {
  @apply space-y-2 font-mono text-sm;
}

.editor-line {
  @apply flex items-center;
}

.line-number {
  @apply w-8 text-gray-500 text-right mr-4;
}

.code-text {
  @apply text-gray-300;
}

.ai-response {
  @apply flex items-start space-x-3 mt-4 p-3;
  @apply bg-primary-900/20 rounded-lg border border-primary-800/30;
}

.ai-avatar {
  @apply w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center;
  @apply text-white;
}

.ai-message {
  @apply space-y-2;
}

.success-indicator {
  @apply flex items-center space-x-2 text-green-400 text-sm;
}

.optimization-tip {
  @apply text-gray-400 text-xs;
}

.floating-elements {
  @apply absolute inset-0 pointer-events-none;
}

.floating-card {
  @apply absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg;
  @apply p-3 border border-gray-200 dark:border-gray-700;
  @apply flex items-center space-x-2;
  animation: float 6s ease-in-out infinite;
  animation-delay: var(--delay);
}

.floating-card:nth-child(1) {
  @apply top-10 right-10;
}

.floating-card:nth-child(2) {
  @apply top-1/2 -right-4;
}

.floating-card:nth-child(3) {
  @apply bottom-20 right-20;
}

.card-icon {
  @apply text-lg;
}

.card-text {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.hero-decoration {
  @apply absolute inset-0 pointer-events-none;
}

.decoration-grid {
  @apply absolute inset-0 opacity-5;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
}

.decoration-gradient {
  @apply absolute top-0 right-0 w-1/2 h-1/2;
  @apply bg-gradient-to-bl from-primary-200/20 to-transparent;
  @apply dark:from-primary-900/20;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .hero-content {
    @apply grid-cols-1 text-center;
  }
  
  .mock-window {
    @apply rotate-0 mt-8;
  }
  
  .floating-elements {
    @apply hidden;
  }
}
</style>
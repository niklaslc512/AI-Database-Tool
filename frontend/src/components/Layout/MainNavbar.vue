<template>
  <nav 
    class="navbar"
    :class="{ 'navbar-scrolled': isScrolled }"
  >
    <div class="navbar-container">
      <!-- 左侧：品牌Logo和导航菜单 -->
      <div class="navbar-left">
        <!-- 品牌Logo -->
        <div class="navbar-brand">
          <div class="logo-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <span class="logo-text">AI数据库管理</span>
        </div>
        
        <!-- 导航菜单 - 桌面端 -->
        <div class="navbar-menu">
          <a href="#features" class="nav-link" @click="scrollToSection('features')">功能特性</a>
          <a href="#demo" class="nav-link" @click="scrollToSection('demo')">产品演示</a>
          <a href="#advantages" class="nav-link" @click="scrollToSection('advantages')">技术优势</a>
        </div>
      </div>
      
      <!-- 右侧：操作区域 -->
      <div class="navbar-actions">
        <ThemeToggle />
        <BaseButton variant="outline" size="md" class="hidden md:inline-flex">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          查看文档
        </BaseButton>
        <BaseButton variant="primary" @click="handleGetStarted">
          开始使用
        </BaseButton>
        
        <!-- 移动端菜单按钮 -->
        <button 
          class="mobile-menu-button md:hidden"
          @click="toggleMobileMenu"
          :aria-label="isMobileMenuOpen ? '关闭菜单' : '打开菜单'"
        >
          <svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 移动端菜单 -->
    <transition name="mobile-menu">
      <div v-if="isMobileMenuOpen" class="mobile-menu">
        <div class="mobile-menu-content">
          <a href="#features" class="mobile-nav-link" @click="handleMobileNavClick('features')">
            功能特性
          </a>
          <a href="#demo" class="mobile-nav-link" @click="handleMobileNavClick('demo')">
            产品演示
          </a>
          <a href="#advantages" class="mobile-nav-link" @click="handleMobileNavClick('advantages')">
            技术优势
          </a>
          <div class="mobile-menu-divider"></div>
          <BaseButton variant="outline" size="md" block class="mb-3">
            查看文档
          </BaseButton>
          <BaseButton variant="primary" block @click="handleGetStarted">
            开始使用
          </BaseButton>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/UI/BaseButton.vue'
import ThemeToggle from '@/components/UI/ThemeToggle.vue'

const router = useRouter()

// 响应式状态
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

// 滚动处理
const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

// 平滑滚动到指定区域
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

// 移动端菜单控制
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const handleMobileNavClick = (sectionId: string) => {
  scrollToSection(sectionId)
  isMobileMenuOpen.value = false
}

// 开始使用按钮处理
const handleGetStarted = () => {
  router.push('/login')
}

// 生命周期
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // 点击外部关闭移动端菜单
  document.addEventListener('click', (e) => {
    const nav = document.querySelector('.navbar')
    if (nav && !nav.contains(e.target as Node)) {
      isMobileMenuOpen.value = false
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
@reference "@/styles/main.css";

.navbar {
  @apply fixed top-0 w-full z-50;
  @apply bg-base-100/80;
  @apply backdrop-blur-md border-b border-primary/20;
  transition: all 0.3s ease;
}

.navbar-scrolled {
  @apply bg-base-100/95;
  @apply border-primary/30;
  @apply shadow-lg;
}

.navbar-container {
  @apply w-full max-w-none px-4 sm:px-6 lg:px-8;
  @apply flex items-center justify-between h-16;
  max-width: calc(100vw - 2rem);
}

@media (min-width: 1024px) {
  .navbar-container {
    max-width: 1280px;
    margin: 0 auto;
  }
}

.navbar-left {
  @apply flex items-center space-x-8;
}

.navbar-brand {
  @apply flex items-center space-x-3;
}

.logo-icon {
  @apply w-10 h-10 bg-gradient-to-br from-green-600 to-green-600;
  @apply rounded-xl flex items-center justify-center text-white;
  @apply shadow-md;
}

.logo-text {
  @apply text-xl font-bold text-base-content;
  @apply hidden sm:block;
}

.navbar-menu {
  @apply hidden md:flex items-center space-x-1;
}

.nav-link {
  @apply px-4 py-2 rounded-lg text-sm font-medium;
  @apply text-base-content hover:text-primary;
  @apply hover:bg-primary/10;
  @apply transition-all duration-200;
}

.navbar-actions {
  @apply flex items-center space-x-3;
}

.mobile-menu-button {
  @apply p-2 rounded-lg;
  @apply text-base-content hover:text-primary;
  @apply hover:bg-primary/10;
  @apply transition-colors duration-200;
}

.mobile-menu {
  @apply md:hidden absolute top-full left-0 right-0;
  @apply bg-base-100;
  @apply border-b border-primary/20;
  @apply shadow-lg;
}

.mobile-menu-content {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4;
}

.mobile-nav-link {
  @apply block px-4 py-3 rounded-lg text-base font-medium;
  @apply text-base-content hover:text-primary;
  @apply hover:bg-primary/10;
  @apply transition-all duration-200;
}

.mobile-menu-divider {
  @apply my-4 border-t border-primary/20;
}

/* 移动端菜单动画 */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

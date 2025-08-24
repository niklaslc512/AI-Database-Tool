<template>
  <button
    @click="toggleTheme"
    class="theme-toggle"
    :aria-label="isDark ? '切换到浅色主题' : '切换到深色主题'"
    :title="getThemeTitle()"
  >
    <transition name="icon-fade" mode="out-in">
      <svg v-if="currentTheme === 'light'" key="sun" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg v-else-if="currentTheme === 'dark'" key="moon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
      <svg v-else key="auto" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </transition>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const { currentTheme, isDark, toggleTheme } = themeStore

const getThemeTitle = () => {
  switch (currentTheme) {
    case 'light':
      return '当前：浅色主题，点击切换到深色主题'
    case 'dark':
      return '当前：深色主题，点击切换到自动主题'
    case 'auto':
      return `当前：自动主题（${isDark ? '深色' : '浅色'}），点击切换到浅色主题`
    default:
      return '切换主题'
  }
}
</script>

<style scoped>
@reference "@/styles/main.css";
.theme-toggle {
  @apply p-2 rounded-lg bg-gray-100 hover:bg-gray-200;
  @apply dark:bg-gray-800 dark:hover:bg-gray-700;
  @apply text-gray-600 dark:text-gray-300;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}

.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: opacity 0.2s ease;
}

.icon-fade-enter-from,
.icon-fade-leave-to {
  opacity: 0;
}
</style>
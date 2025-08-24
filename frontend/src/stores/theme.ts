import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeMode>('auto')
  const isDark = ref(false)
  const systemPrefersDark = ref(false)

  // 初始化系统主题偏好监听
  const initSystemTheme = () => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      systemPrefersDark.value = mediaQuery.matches
      
      // 监听系统主题变化
      mediaQuery.addEventListener('change', (e) => {
        systemPrefersDark.value = e.matches
        if (currentTheme.value === 'auto') {
          applyTheme()
        }
      })
    }
  }

  // 应用主题
  const applyTheme = () => {
    if (typeof window !== 'undefined') {
      let shouldBeDark = false
      
      switch (currentTheme.value) {
        case 'dark':
          shouldBeDark = true
          break
        case 'light':
          shouldBeDark = false
          break
        case 'auto':
          shouldBeDark = systemPrefersDark.value
          break
      }
      
      isDark.value = shouldBeDark
      
      if (shouldBeDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      // 保存主题偏好到本地存储
      localStorage.setItem('theme', currentTheme.value)
    }
  }

  // 设置主题
  const setTheme = (theme: ThemeMode) => {
    currentTheme.value = theme
    applyTheme()
  }

  // 切换主题
  const toggleTheme = () => {
    if (currentTheme.value === 'light') {
      setTheme('dark')
    } else if (currentTheme.value === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }

  // 初始化主题
  const initTheme = () => {
    // 从本地存储读取主题偏好
    const savedTheme = localStorage.getItem('theme') as ThemeMode
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      currentTheme.value = savedTheme
    }
    
    initSystemTheme()
    applyTheme()
  }

  // 监听主题变化
  watch(currentTheme, () => {
    applyTheme()
  })

  return {
    currentTheme,
    isDark,
    systemPrefersDark,
    setTheme,
    toggleTheme,
    initTheme
  }
})
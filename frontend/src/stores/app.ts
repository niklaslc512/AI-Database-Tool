import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, ThemeType, AppSettings } from '@/types'

export const useAppStore = defineStore('app', () => {
  // 状态
  const loading = ref(false)
  const theme = ref<ThemeType>('auto')
  const sidebarCollapsed = ref(false)
  const settings = ref<AppSettings>({
    theme: 'auto',
    language: 'zh-CN',
    autoSave: true,
    queryTimeout: 30000,
    maxRowsPerPage: 100
  })

  // 计算属性
  const isDarkMode = computed(() => {
    if (theme.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.value === 'dark'
  })

  // 方法
  const initialize = async () => {
    try {
      loading.value = true
      
      // 加载用户设置
      loadSettings()
      
      // 应用主题
      applyTheme()
      
      // 监听系统主题变化
      watchSystemTheme()
      
    } catch (error) {
      console.error('应用初始化失败:', error)
    } finally {
      loading.value = false
    }
  }

  const setLoading = (state: boolean) => {
    loading.value = state
  }

  const setTheme = (newTheme: ThemeType) => {
    theme.value = newTheme
    settings.value.theme = newTheme
    applyTheme()
    saveSettings()
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    
    // 如果主题变化，应用新主题
    if (newSettings.theme && newSettings.theme !== theme.value) {
      setTheme(newSettings.theme)
    }
    
    saveSettings()
  }

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('app-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        settings.value = { ...settings.value, ...parsed }
        theme.value = settings.value.theme
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }

  const saveSettings = () => {
    try {
      localStorage.setItem('app-settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  const applyTheme = () => {
    const root = document.documentElement
    
    if (isDarkMode.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const watchSystemTheme = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme()
      }
    })
  }

  return {
    // 状态
    loading,
    theme,
    sidebarCollapsed,
    settings,
    
    // 计算属性
    isDarkMode,
    
    // 方法
    initialize,
    setLoading,
    setTheme,
    toggleSidebar,
    updateSettings,
    loadSettings,
    saveSettings
  }
})
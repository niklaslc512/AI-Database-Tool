import { ref } from 'vue'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const toasts = ref<ToastMessage[]>([])

export function useToast() {
  const showToast = (
    message: string, 
    type: ToastMessage['type'] = 'info', 
    duration: number = 3000
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration
    }
    
    toasts.value.push(toast)
    
    // 自动移除toast
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }
  
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const clearAllToasts = () => {
    toasts.value = []
  }
  
  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts
  }
}

// 全局toast实例
export const globalToast = useToast()
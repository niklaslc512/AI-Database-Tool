import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setupPermissionDirective } from '@/directives/permission'
import './styles/main.css'

const app = createApp(App)

// 使用Pinia状态管理
app.use(createPinia())

// 使用Vue Router
app.use(router)

// 🎨 DaisyUI样式已通过CSS文件引入

// 🛡️ 注册权限指令
setupPermissionDirective(app)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('全局错误:', err, info)
  // 这里可以添加错误上报逻辑
}

app.mount('#app')
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router/router'
import './css/theme.css'

import { createPinia } from 'pinia'
// 创建 Pinia 实例并注册持久化插件
const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.use(router)

app.mount('#app')

import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'
import { registerServiceWorker } from './utils/sw-registration'

// Register Service Worker for PWA
registerServiceWorker()

// Create and mount Vue app
const app = createApp(App)
app.mount('#app')

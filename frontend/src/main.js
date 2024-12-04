import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import axios from 'axios'
import { createNaverMap } from 'vue3-naver-maps'
import apiConfig from './utils/apiConfig'
import '@fortawesome/fontawesome-free/css/all.css'

// Vue 앱 생성
const app = createApp(App)

// 네이버 지도 설정
app.use(createNaverMap, {
  clientId: process.env.VUE_APP_NAVER_CLIENT_ID || apiConfig.NAVER_CLIENT_ID,
  category: 'ncp',
  subModules: []
})

// Vue 라우터 및 Vuex 스토어 사용
app.use(router)
app.use(store)

// 앱 마운트
app.mount('#app')

import App from './App'
import { createSSRApp } from 'vue'
// 1. 导入 Pinia
import * as Pinia from 'pinia';


// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
// import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  // 2. 安装 Pinia
  app.use(Pinia.createPinia());
  return {
    app,
	Pinia // 必须导出 Pinia
  }
}
// #endif
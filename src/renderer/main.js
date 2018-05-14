import Vue from 'vue'

import App from './App'
import api from "~/tools/api.js"
import store from "~/tools/store.js"
import events from "~/tools/events.js"

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import {ipcRenderer} from "electron";


/* 添加ipc通信中间通道 */
ipcRenderer.on("renderMessageTranslate",(event,key,...args)=>{
  events.emit(key,...args);
});
events.on("ipc",(key,...args)=>{
  ipcRenderer.send("MainMessageTranslate",key,...args);
  return false;
});



if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.prototype.$api = api
Vue.prototype.$eve = events
Vue.prototype.$store = new store(window.localStorage,"bls-config");

global.log = console.log();

/* eslint-disable no-new */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')

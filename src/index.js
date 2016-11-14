import {
  Vue,
  Vuex,
  i18n
} from './lib'

import locales from './locales.js'
import jquery from 'jquery'
import lodash from 'lodash'
import {boot} from './boot'
import {invoke} from './eventManager'
import $script from 'scriptjs'

import {
  setConfig,
  getConfig,
  initLoadingAnimation,
  showLoading,
  hideLoading,
  updateState,
} from './utils'

// Ubase对应用开发暴露的接口
window.Ubase = {}
window.Ubase.showLoading = showLoading // 异步动画显示
window.Ubase.hideLoading = hideLoading // 异步动画关闭
window.Ubase.updateState = updateState // 更新state
window.Ubase.invoke = invoke // 跨组件触发方法
window.Ubase.beforeInit = null // 定制应用启动前处理钩子 params {config，router, routes，rootApp, next}

// ubase 生成app入口文件时用的私有方法
window._UBASE_PRIVATE = {}
window._UBASE_PRIVATE.startApp = startApp
window._UBASE_PRIVATE.init = appInit
window._UBASE_PRIVATE.initI18n = initI18n

/* ================start window全局变量=================== */
window.$ = jquery
window.jQuery = jquery
window._ = lodash
window.$script = $script
window.Vue = Vue

/* ================end window全局变量=================== */

// 同步获取app的config信息, 在app启动时第一步执行
function appInit(next) {
  $.ajax({
    async: false,
    url: './config.json'
  }).done(function (res) {
    setConfig(res)
    next && next()
  })
}

// 初始化国际化 获取config信息后第二步执行
function initI18n(i18nData) {
  Vue.use(i18n)
  Vue.config.lang = getConfig()['LANG'] || 'cn'
  var localesData = locales(i18nData)

  Object.keys(localesData).forEach(function (lang) {
    Vue.locale(lang, localesData[lang])
  })
}

// 应用启动入口
function startApp(unused, store, routes) {
  initLoadingAnimation()
  boot(store, routes)
}

import {
  Vue,
  Vuex,
  i18n
} from './lib'

import locales from './locales.js'
import jquery from 'jquery'
import lodash from 'lodash'
import {boot} from './boot'
import $script from 'scriptjs'

import {
  setConfig,
  getConfig,
  initLoadingAnimation,
  showLoading,
  hideLoading,
} from './utils'

window.Ubase = {}
window.Ubase.showLoading = showLoading
window.Ubase.hideLoading = hideLoading
window.Ubase.beforeInit = null // 定制钩子 params {config，router, routes，next}

window._UBASE_PRIVATE = {}
window._UBASE_PRIVATE.startApp = startApp
window._UBASE_PRIVATE.init = appInit
window._UBASE_PRIVATE.initI18n = initI18n

require('jquery.nicescroll')
require('./eventManager')

/* ================start window全局变量=================== */
window.$ = jquery
window.jQuery = jquery
window._ = lodash
window.$script = $script

// deprecated
window.UBASE_STARTAPP = startApp
window.UBASE_INIT = appInit
window.UBASE_INITI18N = initI18n

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
  addUpdateStateMethod(store)
  initLoadingAnimation()
  boot(store, routes)
}

function addUpdateStateMethod(store) {
  Ubase.updateState = function (vuexName, stateOptions) {
    var vuex = store.modules[vuexName]
    _.each(_.keys(stateOptions), function (item) {
      _.set(vuex.state, item, stateOptions[item])
    })
  }
}

import {
  Vue
} from './lib'

// 事件管理, 事件统一注册在eventHub对象中
var eventHub = new Vue({})

Vue.mixin({
  created: function () {
    var eventMap = this.$options.methods
    var currentComponentName = this.$options._ubase_component_name

    // 事件绑定
    if (eventMap && currentComponentName) {
      Object.keys(eventMap).forEach(function (item) {
        eventHub.$on(currentComponentName + '.' + item, eventMap[item])
      })
    }
  }
})

// 事件全局触发
Ubase.invoke = function (event, ...args) {
  eventHub.$emit(event, ...args)
}

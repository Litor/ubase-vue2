import {
  Vue,
  VueRouter,
  VueResource,
  Vuex
} from './lib'
import app from './app'
import {
  preLoadResource,
  setRouter,
  getConfig,
  setRootApp,
  setRequestAnimation
} from './utils'

Vue.use(VueRouter)
Vue.use(VueResource)
Vue.use(Vuex)

setRequestAnimation()

function boot(store, routes) {
  const router = new VueRouter({
    root: '',
    linkActiveClass: 'active',
    hashbang: true,
    routes: routes
  })
  setRouter(router)

  var rootApp = new Vue({
    router,
    render: h => h('router-view'),
    data: () => ({
      config: config
    }),
    store
  })

  setRootApp(rootApp)

  var config = getConfig()
  store = new Vuex.Store(store)

  preLoadResource(function () {
    rootApp.$mount(document.getElementsByTagName('app')[0])
  }, routes)
}

export  {boot}

import Vue from 'vue'
import Router from 'vue-router'
const Speech = () => import('@/components/Speech')
const FormEval = () => import('@/components/FormEval')


Vue.use(Router)

export default new Router({
   mode: 'history',
  routes: [
    {
      path: '/',
      name: 'FormEval',
      component: FormEval
    }
  ]
})

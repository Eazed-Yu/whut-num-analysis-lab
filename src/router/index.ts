import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/lagrange',
      name: 'lagrange',
      component: () => import('../views/LagrangeView.vue'),
    },
    {
      path: '/newton',
      name: 'newton',
      component: () => import('../views/NewtonView.vue'),
    },
    {
      path: '/linear-fit',
      name: 'linearFit',
      component: () => import('../views/LinearFitView.vue'),
    },
  ],
})

export default router

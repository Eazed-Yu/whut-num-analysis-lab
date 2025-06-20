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
    {
      path: '/trapezoid',
      name: 'trapezoid',
      component: () => import('../views/TrapezoidView.vue'),
    },
    {
      path: '/differential-equation',
      name: 'differentialEquation',
      component: () => import('../views/DifferentialEquationView.vue'),
    },
    {
      path: '/equation-root',
      name: 'equationRoot',
      component: () => import('../views/EquationRootView.vue'),
    },
    {
      path: '/linear-system',
      name: 'linearSystem',
      component: () => import('../views/LinearSystemView.vue'),
    },
  ],
})

export default router

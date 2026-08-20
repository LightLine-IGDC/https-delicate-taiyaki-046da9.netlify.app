import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    children: [
      { path: '', redirect: '/modules/works' },
      { path: 'modules/:module', name: 'module', component: () => import('@/views/ModuleView.vue') },
      { path: 'articles', name: 'articles', component: () => import('@/views/ArticlesView.vue') },
      { path: 'articles/:id', name: 'article-edit', component: () => import('@/views/ArticleEditView.vue') },
      { path: 'media', name: 'media', component: () => import('@/views/MediaView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  if (to.meta.public) return true
  if (!auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router

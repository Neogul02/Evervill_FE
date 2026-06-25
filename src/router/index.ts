import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useNavProgress } from '@/composables/useNavProgress'

// '/'와 '/listings/:id'가 같은 컴포넌트 참조를 공유해야 Vue Router가 인스턴스를
// 재사용한다(다른 컴포넌트 객체면 라우트 전환 시 매번 리마운트됨).
const HomeView = () => import('@/views/HomeView.vue')
const MarketView = () => import('@/views/MarketView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/oauth2/callback',
      name: 'oauth2-callback',
      component: () => import('@/views/OAuth2CallbackView.vue'),
    },
    {
      path: '/market',
      name: 'market',
      component: MarketView,
    },
    {
      path: '/market/:id',
      name: 'market-detail',
      component: MarketView,
    },
    {
      path: '/listings/new',
      name: 'listing-create',
      component: () => import('@/views/ListingCreateView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/listings/:id/edit',
      name: 'listing-edit',
      component: () => import('@/views/ListingEditView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/listings/:id',
      name: 'listing-detail',
      component: HomeView,
    },
    {
      path: '/my/listings',
      name: 'my-listings',
      component: () => import('@/views/my/MyListingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my/bookmarks',
      name: 'my-bookmarks',
      component: () => import('@/views/my/MyBookmarksView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my/recent',
      name: 'my-recent',
      component: () => import('@/views/my/RecentListingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my/profile',
      name: 'my-profile',
      component: () => import('@/views/my/MyProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/ChatView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/ai/registry',
      name: 'registry-analysis',
      component: () => import('@/views/RegistryAnalysisView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notices',
      name: 'notices',
      component: () => import('@/views/NoticesView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/dealer/offers',
      name: 'dealer-offers',
      component: () => import('@/views/DealerOffersView.vue'),
      meta: { requiresAuth: true, requiresDealer: true },
    },
    // 개발용 API 테스트 페이지 — 프로덕션 빌드에는 포함되지 않음
    ...(import.meta.env.DEV
      ? [
          {
            path: '/api-test',
            name: 'api-test',
            component: () => import('@/views/ApiTestView.vue'),
          },
        ]
      : []),
    // 에러 페이지
    {
      path: '/error/4xx',
      name: 'error-4xx',
      component: () => import('@/views/error/Error4xxView.vue'),
    },
    {
      path: '/error/5xx',
      name: 'error-5xx',
      component: () => import('@/views/error/Error5xxView.vue'),
    },
    // 404 catch-all — 반드시 마지막에
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/error/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to, from) => {
  if (to.name !== from.name) useNavProgress().start()

  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && authStore.user?.role !== 'ADMIN') {
    return { name: 'home' }
  }
  if (to.meta.requiresDealer && authStore.user?.role !== 'DEALER') {
    return { name: 'home' }
  }
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'home' }
  }
})

router.afterEach(() => {
  useNavProgress().finish()
})

router.onError((error) => {
  console.error('라우터 네비게이션 실패', error)
  useNavProgress().finish()
})

export default router

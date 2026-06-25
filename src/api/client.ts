import axios from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores'

export function userIdHeader() {
  return { 'X-User-Id': useAuthStore().user?.id }
}

// DEALER 권한이 필요한 엔드포인트는 게이트웨이가 역할을 자동 채워주지 않아 X-User-Role도 직접 보내야 함
export function dealerHeaders() {
  const user = useAuthStore().user
  return { 'X-User-Id': user?.id, 'X-User-Role': user?.role }
}

const client = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  // 배열 파라미터를 axios 기본값(regions[]=a&regions[]=b) 대신
  // Spring @RequestParam List<T>가 바로 받는 형식(regions=a&regions=b)으로 직렬화
  paramsSerializer: {
    serialize: (params) => {
      const search = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (Array.isArray(value)) {
          value.forEach((v) => search.append(key, String(v)))
        } else {
          search.append(key, String(value))
        }
      })
      return search.toString()
    },
  },
})

const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/auth/reissue']

client.interceptors.request.use((config) => {
  const isPublic = PUBLIC_PATHS.some((path) => config.url?.startsWith(path))
  const token = localStorage.getItem('token')
  if (token && !isPublic) config.headers.Authorization = `Bearer ${token}`
  return config
})

function clearAuthAndRedirect() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  router.push({ name: 'login' })
}

let refreshPromise: Promise<string | null> | null = null

// 인터셉터를 거치지 않는 별도 axios 호출로 재발급해, 재발급 요청 자체가 401을 받아
// 무한 루프에 빠지는 것을 방지하고 동시 요청 시 토큰을 한 번만 갱신한다(single-flight).
function reissueAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return Promise.resolve(null)

  refreshPromise = axios
    .post('/auth/reissue', { refreshToken })
    .then((res) => {
      const data = res.data?.data
      if (!data?.accessToken) return null
      localStorage.setItem('token', data.accessToken)
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
      return data.accessToken as string
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const config = error.config
    const method = config?.method?.toLowerCase()
    const isGet = method === 'get'
    // AI 요청은 컴포넌트 내부에서 직접 에러를 처리하므로 에러 페이지 이동 제외
    const isAi = config?.url?.startsWith('/api/ai/')
    const isReissue = config?.url?.startsWith('/auth/reissue')
    // 회원가입 실패 시 에러 페이지로 이동하면 입력하던 폼이 모두 날아가므로,
    // RegisterView가 직접 에러 메시지를 보여주도록 페이지 이동에서 제외
    const isSignup = config?.url?.startsWith('/auth/signup')
    // 딜러 가격 제안/수락/취소 실패는 매물 상세/채팅방에서 바로 에러 메시지를 보여주므로 페이지 이동 제외
    const isOffer = config?.url?.includes('/offers')

    if (status === 401 && !isReissue && !config?._retry) {
      const newToken = await reissueAccessToken()
      if (newToken) {
        config._retry = true
        config.headers.Authorization = `Bearer ${newToken}`
        return client(config)
      }
      clearAuthAndRedirect()
    } else if (status >= 500 && !isGet && !isAi && !isSignup && !isOffer) {
      // GET 실패는 컴포넌트에서 인라인 처리 (빈 목록 등)
      // 사용자 액션(POST/PUT/DELETE) 실패만 에러 페이지로 이동
      router.push({ name: 'error-5xx', query: { code: String(status) } })
    } else if (!isGet && !isAi && !isSignup && !isOffer && (status === 403 || status === 400 || status === 429 || status === 408)) {
      router.push({ name: 'error-4xx', query: { code: String(status) } })
    }

    return Promise.reject(error)
  },
)

export default client

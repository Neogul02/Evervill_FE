import axios from 'axios'
import router from '@/router'

const client = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

const PUBLIC_PATHS = ['/auth/login', '/auth/signup']

client.interceptors.request.use((config) => {
  const isPublic = PUBLIC_PATHS.some((path) => config.url?.startsWith(path))
  const token = localStorage.getItem('token')
  if (token && !isPublic) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const method = error.config?.method?.toLowerCase()
    const isGet = method === 'get'

    if (status === 401) {
      localStorage.removeItem('token')
      router.push({ name: 'login' })
    } else if (status >= 500 && !isGet) {
      // GET 실패는 컴포넌트에서 인라인 처리 (빈 목록 등)
      // 사용자 액션(POST/PUT/DELETE) 실패만 에러 페이지로 이동
      router.push({ name: 'error-5xx', query: { code: String(status) } })
    } else if (!isGet && (status === 403 || status === 400 || status === 429 || status === 408)) {
      router.push({ name: 'error-4xx', query: { code: String(status) } })
    }

    return Promise.reject(error)
  },
)

export default client

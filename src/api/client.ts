import axios from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores'

export function userIdHeader() {
  return { 'X-User-Id': useAuthStore().user?.id }
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

import { ref } from 'vue'

/** loading 토글 보일러플레이트를 감싸는 공통 비동기 실행기. 에러 처리는 호출부의 .catch()에서 그대로 담당한다. */
export function useAsyncAction() {
  const loading = ref(false)

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await fn()
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}

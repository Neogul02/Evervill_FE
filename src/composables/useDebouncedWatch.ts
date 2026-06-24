import { watch, type WatchSource } from 'vue'

/** source 값이 바뀐 뒤 delay(ms) 동안 추가 변경이 없으면 callback을 1회 실행한다. */
export function useDebouncedWatch<T>(source: WatchSource<T>, callback: () => void, delay = 400) {
  let timer: ReturnType<typeof setTimeout> | undefined

  const stop = watch(source, () => {
    clearTimeout(timer)
    timer = setTimeout(callback, delay)
  })

  return stop
}

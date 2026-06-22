import { useMediaQuery } from '@vueuse/core'

export function useBreakpoint() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return { isDesktop }
}

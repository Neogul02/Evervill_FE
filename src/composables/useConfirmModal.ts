import { ref, readonly } from 'vue'

interface ModalOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

// 모듈 스코프 싱글톤 — App.vue에서 한 번만 렌더링
const visible = ref(false)
const options = ref<ModalOptions>({})
let resolveFn: ((ok: boolean) => void) | null = null

export function useConfirmModal() {
  function open(opts: ModalOptions = {}): Promise<boolean> {
    options.value = opts
    visible.value = true
    return new Promise((resolve) => {
      resolveFn = resolve
    })
  }

  function confirm() {
    visible.value = false
    resolveFn?.(true)
    resolveFn = null
  }

  function cancel() {
    visible.value = false
    resolveFn?.(false)
    resolveFn = null
  }

  return {
    visible: readonly(visible),
    options: readonly(options),
    open,
    confirm,
    cancel,
  }
}

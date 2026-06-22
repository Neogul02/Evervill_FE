import { ref } from 'vue'

const active = ref(false)
const progress = ref(0)

let timer: ReturnType<typeof setInterval> | undefined
let resetTimer: ReturnType<typeof setTimeout> | undefined

export function useNavProgress() {
  function start() {
    clearInterval(timer)
    clearTimeout(resetTimer)
    active.value = true
    progress.value = 20
    timer = setInterval(() => {
      if (progress.value < 85) progress.value += (85 - progress.value) * 0.15
    }, 100)
  }

  function finish() {
    clearInterval(timer)
    progress.value = 100
    resetTimer = setTimeout(() => {
      active.value = false
      progress.value = 0
    }, 200)
  }

  return { active, progress, start, finish }
}

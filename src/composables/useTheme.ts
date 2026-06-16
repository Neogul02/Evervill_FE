import { ref } from 'vue'

const isDark = ref(false)

function applyTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem('theme', dark ? 'dark' : 'light')
}

export function useTheme() {
  function toggle() {
    applyTheme(!isDark.value)
  }

  function init() {
    const saved = localStorage.getItem('theme')
    if (saved) {
      applyTheme(saved === 'dark')
    } else {
      applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches)
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) applyTheme(e.matches)
      })
    }
  }

  return { isDark, toggle, init }
}

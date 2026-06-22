import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  define: {
    // sockjs-client는 Node의 global 객체를 참조하므로 브라우저 환경에서 폴리필 필요
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '^/api/ws': {
        target: 'http://168.107.54.139:8080',
        changeOrigin: true,
        ws: true,
      },
      '^/api/': {
        target: 'http://168.107.54.139:8080',
        changeOrigin: true,
        ws: true,
      },
      '^/auth/': {
        target: 'http://168.107.54.139:8080',
        changeOrigin: true,
      },
      '^/oauth2/authorization/': {
        target: 'http://168.107.54.139:8080',
        changeOrigin: true,
      },
      '^/login/oauth2/': {
        target: 'http://168.107.54.139:8080',
        changeOrigin: true,
      },
    },
  },
})

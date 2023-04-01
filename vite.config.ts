import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "src", replacement: "/src" }],
  },
  server: {
    proxy: {
      '/v1/chat/completions': 'https://api.openai.com/',
    },
  },
})

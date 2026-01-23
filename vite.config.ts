import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // 这里告诉 Vercel：我有两个家！
        main: 'index.html',  // 主页
        admin: 'admin.html', // 后台管理页
      },
    },
  },
})

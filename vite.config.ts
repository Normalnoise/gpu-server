import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3456
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        modifyVars: {
          '@primary-color': '#1890ff',
          '@layout-header-background': '#001529',
          '@layout-body-background': '#000000',
          '@component-background': '#141414',
          '@body-background': '#000000',
          '@text-color': 'rgba(255, 255, 255, 0.85)',
          '@border-color-base': '#303030'
        }
      }
    }
  }
})
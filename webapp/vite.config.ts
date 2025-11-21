import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/paycheck_waterfall_app/' : '/',
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    setupFiles: './test/setupTests.ts',
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**']
  }
})

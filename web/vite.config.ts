/// <reference types="vitest" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { breakpointTokensPlugin } from './vite/breakpointTokens.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), breakpointTokensPlugin()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    globals: true,
    // jsdom so the component tests can render real DOM (T-14).
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.ts'],
    // Thư mục `e2e/` là test Playwright, không phải test Vitest — loại khỏi
    // `exclude` để `npm test` không cố chạy chúng bằng Vitest.
    exclude: ['**/node_modules/**', 'e2e/**', 'dist/**'],
    // Timeout mặc định của Vitest là 5 s. Trên CI (hoặc khi chạy song song với
    // Maven) máy có thể chậm, và một test cần ~1,2 s khi chạy riêng sẽ vượt
    // 5 s khi tải cao ⇒ báo đỏ giả. Nâng lên 15 s để ngưỡng phản ánh lỗi thật
    // (assertion fail, promise không resolve) chứ không phản ánh tải máy.
    testTimeout: 15000,
    env: {
      VITE_API_BASE_URL: 'http://gateway.test',
      VITE_MEDIA_BASE_URL: 'http://media.test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      // Chỉ tính code ứng dụng, không tính test và file khai báo kiểu.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'src/**/index.ts',
        'src/shared/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      // Ngưỡng chất lượng: CI fail khi coverage tụt dưới mức này.
      //
      // Đặt bằng mức đo thực tế hiện tại, tức là **ratchet**: CI chặn khi
      // coverage tụt, chứ chưa đòi 70%. Mức 70% là mục tiêu, không phải ngưỡng
      // chặn — đặt luôn 70% sẽ làm workflow đỏ ngay từ commit đầu tiên và
      // dạy cả đội rằng bỏ qua CI.
      // Mỗi khi thêm test, nâng các con số này lên theo.
      // Lịch sử: 17/12/18/17 → 18/13/19/18 → 19/14/20/19 → 23/18/23/23
      // (đo được 23,6% statements / 24,3% lines vào 05/11/2026).
      //
      // Lưu ý: con số dưới đây là sàn chặn hồi quy. Đừng hạ chúng xuống để
      // "cho CI xanh" — mỗi lần hạ là mất lớp bảo vệ đã có.
      thresholds: {
        lines: 23,
        functions: 18,
        branches: 23,
        statements: 23,
      },
    },
  },
  build: {
    // Ngưỡng cảnh báo: 250 kB (gzip ~80 kB) cho một chunk. Đặt cao như cũ
    // (500) thì cảnh báo không bao giờ bật và không còn ý nghĩa. Chunk lớn
    // nhất hiện tại là `react-core` (~219 kB) — hợp lý vì React phải luôn có mặt.
    chunkSizeWarningLimit: 250,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/')
          ) {
            return 'react-core'
          }
          if (
            id.includes('node_modules/react-router/') ||
            id.includes('node_modules/react-router-dom/') ||
            id.includes('node_modules/@remix-run/')
          ) {
            return 'router'
          }
          if (id.includes('node_modules/axios/')) {
            return 'network'
          }
          // TanStack Query đi kèm React Query dùng chung; tách riêng để
          // không phình thêm vào chunk `network` và để cache layer được
          // ghi đè riêng khi nâng phiên bản.
          if (
            id.includes('node_modules/@tanstack/react-query/') ||
            id.includes('node_modules/@tanstack/query-core/')
          ) {
            return 'query-cache'
          }
        },
      },
    },
  },
})

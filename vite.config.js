import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' — GitHub Pages의 하위 디렉터리(/저장소이름/)에 배포해도
// 에셋 경로가 깨지지 않도록 상대 경로를 사용한다.
// 라우팅은 HashRouter를 쓰므로 새로고침·직접 진입에도 404가 나지 않는다.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
})

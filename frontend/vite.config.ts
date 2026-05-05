import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed to custom domain https://osint.builders/ at the root path.
// The Pages workflow sets PAGES_BASE='/' for production builds.
// Local dev (`npm run dev`) uses the same root path.
const base = process.env.PAGES_BASE ?? '/'

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'onnx': ['onnxruntime-web']
        }
      }
    }
  },
  server: {
    port: 5173
  }
})

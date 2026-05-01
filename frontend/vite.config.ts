import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/search/',
  build: {
    outDir: '../docs/search',
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

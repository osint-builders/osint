import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On GitHub Pages a project site is served at https://<owner>.github.io/<repo>/.
// The Pages workflow sets PAGES_BASE='/<repo>/search/' so this build resolves
// asset URLs relative to that path. Local dev (`npm run dev`) leaves
// PAGES_BASE unset and falls back to '/search/', which `vite preview` and the
// dev server handle natively.
const base = process.env.PAGES_BASE ?? '/search/'

export default defineConfig({
  plugins: [react()],
  base,
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

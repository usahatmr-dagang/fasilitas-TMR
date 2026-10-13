import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    base: process.env.GITHUB_ACTIONS ? '/fasilitas-TMR/' : '/',
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      port: 3000,
      strictPort: false,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('pizzip') || id.includes('docxtemplater') || id.includes('mammoth') || id.includes('file-saver') || id.includes('exceljs')) {
                return 'vendor-docs';
              }
              if (id.includes('lucide-react')) return 'vendor-icons';
              return 'vendor-core';
            }
          }
        }
      }
    }
  }
})

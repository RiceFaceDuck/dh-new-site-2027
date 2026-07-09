import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'

import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(), 
    react(), 
    viteCompression(),
    mode === 'analyze' && visualizer({ open: true, filename: 'stats.html', gzipSize: true, brotliSize: true })
  ],
  resolve: {
    dedupe: ['firebase']
  },
  optimizeDeps: {
    force: true,
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics', 'firebase/app-check', 'zod']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('react-big-calendar')) return 'vendor-calendar';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            
            // Combine react and other remaining node_modules to prevent circular chunk warnings
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**', 'src/firebase/warrantyService.test.js']
  }
}));

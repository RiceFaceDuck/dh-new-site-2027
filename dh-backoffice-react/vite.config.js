import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('framer-motion')) return 'vendor-framer-motion';
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
  }
})
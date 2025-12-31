import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Split Supabase
          'supabase': ['@supabase/supabase-js'],
          // Split large UI libraries
          'ui-vendor': ['lucide-react', 'embla-carousel-react'],
          // Split DnD Kit
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // Split utilities
          'utils': ['date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // Increase limit if needed (default is 500kb)
  },
});
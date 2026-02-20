import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('react-router')) {
            return 'router-vendor';
          }

          if (id.includes('jspdf')) {
            return 'pdf-core-vendor';
          }

          if (id.includes('html2canvas') || id.includes('canvg') || id.includes('dompurify')) {
            return 'pdf-render-vendor';
          }

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
    dedupe: ['react', 'react-dom'],
  },
  define: {
    // Explicitly set to false in production builds
    __ENABLE_ADMIN__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['xlsx']
  },
  build: {
    commonjsOptions: {
      include: [/xlsx/, /node_modules/]
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['lucide-react', 'framer-motion'],
          'date': ['date-fns']
        }
      }
    }
  },
  resolve: {
    alias: {
      './dist/cpexcel.js': '',
      '@': path.resolve(__dirname, './src'),
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    hmr: {
      overlay: false,
      clientPort: 5173
    },
    watch: {
      usePolling: true,
      interval: 100
    },
    middlewareMode: false
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: true
  },
  base: '/',
  appType: 'spa'
});

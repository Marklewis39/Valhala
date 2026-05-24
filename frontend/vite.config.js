import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Get the app mode from environment variable (customer, admin, or driver)
const appMode = process.env.VITE_APP_MODE || 'customer';

// Configure ports for different apps
const getPort = () => {
  switch (appMode) {
    case 'admin':
      return 3001;
    case 'driver':
      return 3002;
    default:
      return 3000;
  }
};

// Configure build output directory
const getOutDir = () => {
  switch (appMode) {
    case 'admin':
      return 'dist/admin';
    case 'driver':
      return 'dist/driver';
    default:
      return 'dist/customer';
  }
};

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  publicDir: 'public',
  server: {
    port: getPort(),
    open: true,
    host: true
  },
  build: {
    outDir: getOutDir(),
    sourcemap: false,
    minify: 'esbuild', // Changed from 'terser' to 'esbuild' (faster, no extra dependency)
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        // Simplified manual chunks - only split if modules exist
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('recharts') || id.includes('date-fns')) {
              return 'ui';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'maps';
            }
            // All other node_modules go to vendor
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2020'
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    },
    include: ['react', 'react-dom', 'react-router-dom', 'firebase/app', 'firebase/auth']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  define: {
    __APP_MODE__: JSON.stringify(appMode),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __DEV__: process.env.NODE_ENV !== 'production'
  },
  css: {
    postcss: path.resolve(__dirname, './postcss.config.js')
  }
})
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    
    // Configuración de build optimizada
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'esbuild', // Usar esbuild en lugar de terser (más rápido)
      rollupOptions: {
        output: {
          // Code splitting manual para mejor caching
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-form': ['react-hook-form', 'zod'],
            'vendor-charts': ['recharts'],
          },
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    
    // Configuración de servidor de desarrollo
    server: {
      port: 5173,
      host: true,
      open: false,
    },
    
    // Preview server (para probar build localmente)
    preview: {
      port: 4173,
      host: true,
    },
    
    // Optimización de dependencias
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
      ],
    },
  };
});


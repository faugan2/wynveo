import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  // es2022 : nécessaire pour le choix de la source de données au démarrage (await de premier niveau)
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  esbuild: { target: 'es2022' },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
  css: { modules: { localsConvention: 'camelCaseOnly' } },
});

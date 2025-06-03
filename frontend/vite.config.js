import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';

export default defineConfig(({ mode }) => {
  // Load .env files manually
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(),
      eslint({
        lintOnStart: true,
        failOnError: mode === 'production',
      }),
    ],
    server: {
      proxy: {
        '/api': env.VITE_SOCKET_URL || 'http://localhost:8000',
      },
    },
  };
});


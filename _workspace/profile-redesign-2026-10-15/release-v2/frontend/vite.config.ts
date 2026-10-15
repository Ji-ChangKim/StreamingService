import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || 'https://streaming.gametps.workers.dev';

  return {
    // 개발 전용 화면 셸과 기존 운영 셸을 각각 빌드한다.
    build: { rollupOptions: { input: { main: 'index.html', dev: 'dev.html', portal: 'portal.html' } } },
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});


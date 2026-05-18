import { defineConfig } from 'vite'

export default defineConfig({
  base: '/botse_audio/',
  server: {
    port: 5174,
    proxy: {
      // Proxy para evitar CORS al descargar el soundtrack desde R2 en desarrollo local
      '/r2-dev': {
        target: 'https://pub-9c76245f9aec45568e61253e0404de1e.r2.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/r2-dev/, '')
      }
    }
  }
})
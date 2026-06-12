import { defineConfig } from 'vite'

const fixJsContentType = {
  name: 'fix-js-content-type',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const isJsRequest = /\.(js|mjs|ts|jsx|tsx)(\?|$)/.test(req.url ?? '');
      const orig = res.setHeader.bind(res);
      res.setHeader = (name, value) => {
        if (isJsRequest && name.toLowerCase() === 'content-type' && typeof value === 'string') {
          value = value.replace('text/javascript', 'application/javascript');
        }
        return orig(name, value);
      };
      const origWriteHead = res.writeHead.bind(res);
      res.writeHead = function (statusCode, reason, obj) {
        if (!res.getHeader('cache-control')) {
          res.setHeader('cache-control', 'no-store');
        }
        return origWriteHead(statusCode, reason, obj);
      };
      next();
    });
  },
};

export default defineConfig({
  base: '/botse_audio/',
  plugins: [fixJsContentType],
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
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'opdly-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            try {
              const { app } = await import('./api/index.js');
              return app(req, res, next);
            } catch (err) {
              console.error('[API Middleware Load Error]', err);
              next();
            }
          } else {
            next();
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
  },
});

import path from 'path';
import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json' with { type: 'json' };

const getBuildCommit = () => {
  const envCommit = process.env.COOLIFY_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (envCommit) return envCommit.slice(0, 7);

  try {
    return execSync('git rev-parse --short HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch {
    return new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 12);
  }
};

const buildCommit = getBuildCommit();
const buildDate = new Date().toISOString();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_BUILD_COMMIT__: JSON.stringify(buildCommit),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
  plugins: [
    {
      name: 'ffbb-matches-dev-api',
      configureServer(server) {
        const handleFfbbRequest = async (req: any, res: any) => {
          try {
            const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
            const team = url.searchParams.get('team') || '';
            const pythonCmd = `./.venv/bin/python scripts/export_ffbb_json.py ${team ? `--team "${team}"` : ''}`;
            const output = execSync(pythonCmd, { encoding: 'utf8' });
            res.setHeader('Content-Type', 'application/json');
            res.end(output);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Erreur FFBB Data Client' }));
          }
        };

        server.middlewares.use('/api/ffbb-matches', handleFfbbRequest);
        server.middlewares.use('/api/v1/club/9326/matches', handleFfbbRequest);
      },
    },
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'logo-scba.webp',
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-48x48.png',
        'favicon-96x96.png',
        'favicon-192x192.png',
        'apple-touch-icon.webp',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-192x192.webp',
        'pwa-512x512.webp',
      ],
      devOptions: {
        enabled: false,
      },
      manifest: {
        id: '/',
        name: 'SCBA Bénévoles',
        short_name: 'SCBA',
        description: 'Gestion du bénévolat - Stade Clermontois Basket Auvergne',
        lang: 'fr',
        dir: 'ltr',
        theme_color: '#272890',
        background_color: '#efe9f0',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/?source=pwa',
        scope: '/',
        categories: ['sports', 'utilities'],
        shortcuts: [
          {
            name: 'Matchs à venir',
            short_name: 'Matchs',
            description: 'Voir la liste des prochains matchs et besoins bénévoles',
            url: '/?source=shortcut',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Planning & Calendrier',
            short_name: 'Planning',
            description: 'Consulter la grille de planning des matchs',
            url: '/?tab=planning&source=shortcut',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        screenshots: [
          {
            src: '/screenshot-hero.webp',
            sizes: '1280x720',
            type: 'image/webp',
            form_factor: 'wide',
            label: 'Tableau de bord des bénévoles SCBA',
          },
          {
            src: '/screenshot-hero.webp',
            sizes: '720x1280',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Gestion des matchs sur mobile',
          },
        ],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB: ensure large bundles & fontsource fonts are precached
        // Precache essential files for offline support including self-hosted fonts
        globPatterns: ['**/*.{html,js,css,woff2,woff,ico,png,svg,webp,webmanifest}'],
        // Runtime caching: FFBB data API resilient offline strategy + static assets (Firebase excluded)
        runtimeCaching: [
          {
            // FFBB API - NetworkFirst with 3s timeout, 7 days TTL (network handles freshness, cache provides offline safety)
            urlPattern:
              /^https:\/\/ffbb-api\.desimone\.fr\/.*|^\/api\/(v1\/club\/|ffbb-matches).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ffbb-api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 604800, // 7 days (604800s)
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Images & self-hosted fonts - CacheFirst for instant offline rendering
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp|woff2?|woff|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Versioned JS/CSS bundles - StaleWhileRevalidate
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/scheduler')
          ) {
            return 'vendor-react';
          }
          // Split Firebase into sub-chunks: auth (rarely changes) vs firestore/storage
          // so a Firestore SDK update doesn't bust the auth chunk cache.
          if (
            id.includes('node_modules/firebase/auth') ||
            id.includes('node_modules/@firebase/auth')
          ) {
            return 'vendor-firebase-auth';
          }
          if (
            id.includes('node_modules/firebase/storage') ||
            id.includes('node_modules/@firebase/storage')
          ) {
            return 'vendor-firebase-storage';
          }
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase-core';
          }
          if (
            id.includes('node_modules/framer-motion') ||
            id.includes('node_modules/lucide-react')
          ) {
            return 'vendor-ui';
          }
        },
      },
    },
  },
});

import path from 'path';
import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import packageJson from './package.json' with { type: 'json' };

const getBuildCommit = () => {
  const envCommit = process.env.COOLIFY_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (envCommit) return envCommit.slice(0, 7);

  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);
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
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', {}]],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-scba.webp', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.webp', 'apple-touch-icon.png'],
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'SCBA Bénévoles',
        short_name: 'SCBA',
        description: 'Gestion du bénévolat - Stade Clermontois Basket Auvergne',
        theme_color: '#1e293b',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.webp',
            sizes: '192x192',
            type: 'image/webp'
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp'
          },
          {
            src: 'pwa-512x512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'maskable'
          },
          // PNG fallbacks for older browsers
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigationPreload: false, // Disabled to prevent preload warnings - NetworkFirst is sufficient
        // Precache essential files for offline support
        globPatterns: ['**/*.{html,js,css,woff2}'],
        // Use NetworkFirst for everything - always try network first
        runtimeCaching: [
          {
            // HTML pages - always fresh
            urlPattern: /\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5 // 5 minutes only
              },
              networkTimeoutSeconds: 3
            }
          },
          {
            // JS/CSS bundles - network first with short cache
            urlPattern: /\.(js|css)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 10 // 10 minutes
              },
              networkTimeoutSeconds: 3
            }
          },
          {
            // Images/fonts - can be cached longer
            urlPattern: /\.(png|jpg|jpeg|svg|gif|ico|woff2?|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          },
          {
            // Firebase/API - always network first
            urlPattern: /^https:\/\/(firestore|firebase)\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 5
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          // Split Firebase into sub-chunks: auth (rarely changes) vs firestore/storage
          // so a Firestore SDK update doesn't bust the auth chunk cache.
          if (id.includes('node_modules/firebase/auth') || id.includes('node_modules/@firebase/auth')) {
            return 'vendor-firebase-auth';
          }
          if (id.includes('node_modules/firebase/storage') || id.includes('node_modules/@firebase/storage')) {
            return 'vendor-firebase-storage';
          }
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase-core';
          }
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }
        }
      }
    }
  }
});

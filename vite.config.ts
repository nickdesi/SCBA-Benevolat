import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
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
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
        }
      }
    }
  }
});

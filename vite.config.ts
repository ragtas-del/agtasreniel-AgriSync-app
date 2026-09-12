import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
  preview: {
    host: true,
    port: 4173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'icon-192.svg', 'icon-512.svg', 'maskable-512.svg'],
      manifest: {
        id: '/',
        name: 'Rice Farm Expense Recording and Monitoring System',
        short_name: 'Rice Farm Expenses',
        description: 'Offline-first rice farm expense recording and monitoring system',
        theme_color: '#1d4e3b',
        background_color: '#f7f4ee',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay', 'minimal-ui'],
        orientation: 'portrait',
        lang: 'en',
        dir: 'ltr',
        scope: '/',
        start_url: '/',
        categories: ['agriculture', 'finance', 'business'],
        icons: [
          { src: 'app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-app-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'app-icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // No active service worker: only enables installability (manifest + icons),
      // no offline caching (out of scope for V1, see plan section 2).
      injectRegister: null,
      registerType: 'autoUpdate',
      // `generateSW` (the default strategy) still builds sw.js with a full
      // precache manifest of every app asset even though nothing registers
      // it today — harmless while that stays true, but a silent multi-MB
      // Cache Storage write waiting to happen if a future change ever does
      // register it. Emptied explicitly so a dormant service worker can
      // never precache anything, matching the "no offline caching" scope.
      workbox: {
        globPatterns: [],
      },
      manifest: {
        name: 'Markdown Space',
        short_name: 'Markdown Space',
        description: 'Create, edit and preview Markdown files from the browser.',
        lang: 'en',
        theme_color: '#181818',
        background_color: '#181818',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})

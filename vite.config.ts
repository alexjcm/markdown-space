import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Sin service worker activo: solo habilita instalabilidad (manifest + iconos),
      // no caché offline (fuera de alcance en la V1, ver plan sección 2).
      injectRegister: null,
      registerType: 'autoUpdate',
      manifest: {
        name: 'Markdown Space',
        short_name: 'Markdown Space',
        description: 'Crea, edita y previsualiza archivos Markdown desde el navegador.',
        lang: 'es',
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

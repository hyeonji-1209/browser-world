import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'browser-world',
        short_name: 'world',
        description: '픽셀 생명체들이 살고, 먹고, 번식하고, 진화하는 작은 세계',
        theme_color: '#fdf2f8',
        background_color: '#fdf2f8',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  // Tauri 개발 서버 고정 포트
  server: { port: 1420, strictPort: true },
  clearScreen: false,
})

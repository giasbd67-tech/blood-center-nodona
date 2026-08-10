import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // 🔴 PWA-কে বলা হচ্ছে যেন সে ads.txt, sitemap.xml, এবং robots.txt ইন্টারসেপ্ট না করে
        navigateFallbackDenylist: [/^\/ads\.txt$/, /^\/sitemap\.xml$/, /^\/robots\.txt$/],
      },
      manifest: {
        name: 'Blood Center Nodona Noakhali',
        short_name: 'Blood Center',
        description: 'Blood donor management app',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})

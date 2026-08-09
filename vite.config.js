import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/', // 🔴 পরিবর্তন ১: './' তুলে দিয়ে absolute path '/' করা হলো
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,txt}'], // 🔴 পরিবর্তন ২: txt ফরম্যাট যুক্ত করা হলো
        navigateFallbackDenylist: [/^\/ads\.txt$/] // 🔴 পরিবর্তন ৩: PWA সার্ভিস ওয়ার্কারকে ads.txt ক্যাচ করতে নিষেধ করা হলো
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

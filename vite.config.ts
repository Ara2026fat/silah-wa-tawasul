import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Single codebase, responsive PWA that installs on Android, iOS (iPhone/iPad),
// Windows, macOS and Linux. Service worker + manifest are generated here.
export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Library code changes far less often than app code — splitting it
        // out means a normal app update only re-downloads a small chunk,
        // not the whole bundle, since the vendor chunk stays cached.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-data': ['dexie', 'dexie-react-hooks', 'zustand'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-180.png',
        'icons/favicon-32.png',
        'icons/favicon-16.png',
      ],
      manifest: {
        id: '/',
        name: 'صلة وتواصل',
        short_name: 'صلة وتواصل',
        description: 'ذكّرك بمن يهمّونك، وتواصل معهم بضغطة واحدة.',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#3F5C4C',
        background_color: '#FAF7F1',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // App shell + data are local-first; runtime caching keeps assets
        // available offline after the first load.
        navigateFallback: '/index.html',
        // A new version activates and takes control as soon as it's
        // downloaded (paired with registerType: 'autoUpdate' above)
        // instead of waiting for every tab to fully close first, and
        // caches from the previous version are removed once it does —
        // otherwise "update" can silently never complete for a PWA that's
        // rarely fully closed.
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
});

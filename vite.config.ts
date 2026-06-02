import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PM Assistant — pure-browser PWA. No backend.
// The SQLite-WASM package ships its own worker assets; exclude from pre-bundling
// so they load correctly at runtime.
export default defineConfig(({ command }) => ({
  // On GitHub Pages the app is served from the repo subpath
  // (https://<user>.github.io/PM-Assistant/), so the production build needs that
  // base for assets to resolve. Local dev stays at root so `npm run dev` is clean.
  base: command === 'build' ? '/PM-Assistant/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'PM Assistant',
        short_name: 'PM Assistant',
        description: 'Your personal PM operating system + coach.',
        theme_color: '#E59866',
        background_color: '#FBF6EF',
        display: 'standalone',
        // Relative so it resolves under any base (root in dev, /PM-Assistant/ on Pages).
        start_url: '.',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  // Same port for dev and preview so the app's origin (and therefore its
  // localStorage data) is identical however it's launched.
  server: { port: 5173 },
  preview: { port: 5173 },
}));

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site from /sobha-3d/, so all asset URLs must be
  // relative to the deploy root rather than the domain root.
  base: './',
  build: {
    // NOTE: do NOT force three.js / r3f into their own chunks. Rolldown then
    // makes the entry chunk statically import them, which means the browser
    // downloads ~1MB before the page can paint — the exact opposite of the
    // lazy() on the Scene component. The dynamic import already splits it
    // correctly, and Vite emits the right <script>/<link> tags on its own.
    chunkSizeWarningLimit: 900,
  },
})

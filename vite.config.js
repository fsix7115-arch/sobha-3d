import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site from /sobha-3d/, so all asset URLs must be
  // relative to the deploy root rather than the domain root.
  base: './',
})

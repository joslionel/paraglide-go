import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves this repo from /paraglide-go/ — only apply that
  // prefix to production builds so local dev stays at the root URL.
  base: command === 'build' ? '/paraglide-go/' : '/',
  plugins: [react(), tailwindcss()],
}))

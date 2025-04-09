import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9000,
    strictPort: true, // This will fail if the port is already in use
  },
  // Ensure proper base URL for routing
  base: '/'
})

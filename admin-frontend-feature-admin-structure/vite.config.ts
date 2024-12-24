import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@page": path.resolve(__dirname, "./src/page"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@component": path.resolve(__dirname, "./src/component"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    }
  }
})

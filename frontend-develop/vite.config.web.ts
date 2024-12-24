import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
  build: {
    outDir: "dist",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@view": path.resolve(__dirname, "./src/view"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@component": path.resolve(__dirname, "./src/component"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@font": path.resolve(__dirname, "./src/font"),
      "@service": path.resolve(__dirname, "./src/service"),
    },
  },
});

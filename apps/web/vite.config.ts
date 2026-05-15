// apps/web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: "/",
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    cors: true,
    allowedHosts:
      mode === "production"
        ? ["mecpro.tec.br", "www.mecpro.tec.br"]
        : ["localhost", "127.0.0.1", ".ngrok-free.dev"],
  },
  build: {
    outDir: "dist",
    target: "es2020",
  },
  preview: {
    host: true,
    port: 8080,
  },
}));
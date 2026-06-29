import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const devApiProxyTarget = process.env.DEV_API_PROXY_TARGET ?? "http://127.0.0.1:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: devApiProxyTarget,
        changeOrigin: true
      }
    }
  }
});

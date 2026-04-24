import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiProxyTarget = "http://localhost:4000";

const createApiProxy = () => ({
  target: apiProxyTarget,
  changeOrigin: true,
});

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      "/auth": createApiProxy(),
      "/clinics": createApiProxy(),
      "/users": createApiProxy(),
      "/specializations": createApiProxy(),
      "/doctors": createApiProxy(),
      "/patients": createApiProxy(),
      "/appointments": createApiProxy(),
      "/messages": createApiProxy(),
      "/follow-ups": createApiProxy(),
      "/imports": createApiProxy(),
      "/message-templates": createApiProxy(),
      "/admin": createApiProxy(),
      "/clinic-settings": createApiProxy(),
      "/doctor-schedules": createApiProxy(),
      "/responses": createApiProxy(),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          ui: ["lucide-react"],
        },
      },
    },
  },
});
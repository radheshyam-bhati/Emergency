import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": "http://127.0.0.1:3001",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("@tanstack/react-query")) {
              return "vendor-tanstack";
            }
            if (id.includes("framer-motion")) {
              return "vendor-framer-motion";
            }
            if (id.includes("leaflet")) {
              return "vendor-leaflet";
            }
            if (id.includes("recharts")) {
              return "vendor-recharts";
            }
            if (id.includes("lucide-react")) {
              return "vendor-lucide";
            }
            if (id.includes("sonner")) {
              return "vendor-sonner";
            }
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

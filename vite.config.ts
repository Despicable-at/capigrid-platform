import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // REMOVED: runtimeErrorOverlay() - This was causing the error
    // REMOVED: Replit-specific cartographer plugin - Not needed for production
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Add this to handle large chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Add manual chunking for better optimization
          react: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts', 'chart.js'],
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true
  },
  preview: {
    port: 8080,
    strictPort: true
  }
});

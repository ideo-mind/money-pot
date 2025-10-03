import { defineConfig, loadEnv } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react(),
      cloudflare(),
    ],
    build: {
      outDir: 'dist',
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isProduction ? false : true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            aptos: ['@aptos-labs/ts-sdk', '@aptos-labs/wallet-adapter-react'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          },
        },
      },
      target: 'esnext',
      cssCodeSplit: true,
    },
    css: {
      devSourcemap: true,
    },
    server: {
      host: true,
      port: 3000,
    },
    preview: {
      host: true,
      port: 4173,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@aptos-labs/ts-sdk",
        "@aptos-labs/wallet-adapter-react",
      ],
    },
    define: {
      global: "globalThis",
    },
    esbuild: {
      target: 'esnext',
    },
  };
});

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import path from 'path'

// Vite recommends exporting a function to access mode
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // Loads all env vars, not just VITE_

  return {
    plugins: [
      react(),
      cloudflare({
        configPath: './wrangler.toml',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@abis': path.resolve(__dirname, './src/abis'),
        '@shared': path.resolve(__dirname, './shared'),
      },
    },
    define: {
      // Expose environment variables for the client
      'import.meta.env.APTOS_NODE_URL': JSON.stringify(env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com/v1'),
      'import.meta.env.MONEY_AUTH_URL': JSON.stringify(env.MONEY_AUTH_URL || 'https://auth.money-pot.unreal.art'),
    },
    server: {
      port: parseInt(env.PORT || '3000'),
      host: '0.0.0.0',
    },
    preview: {
      port: parseInt(env.PORT || '4173'),
      host: '0.0.0.0',
    },
  }
})

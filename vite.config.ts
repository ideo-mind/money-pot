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
      'import.meta.env.VITE_APTOS_NODE_URL': JSON.stringify(env.VITE_APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com/v1'),
      'import.meta.env.VITE_MONEY_POT_CONTRACT_ADDRESS': JSON.stringify(env.VITE_MONEY_POT_CONTRACT_ADDRESS || '0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f'),
      'import.meta.env.VITE_VERIFIER_SERVICE_URL': JSON.stringify(env.VITE_VERIFIER_SERVICE_URL || 'https://auth.money-pot.unreal.art'),
      'import.meta.env.VITE_VERIFIER_SERVICE_BASE_URL': JSON.stringify(env.VITE_VERIFIER_SERVICE_BASE_URL || ''),
      'import.meta.env.VITE_USDC_TOKEN_ADDRESS': JSON.stringify(env.VITE_USDC_TOKEN_ADDRESS || '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17da'),
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

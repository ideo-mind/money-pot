/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APTOS_NODE_URL: string
  readonly VITE_MONEY_POT_CONTRACT_ADDRESS: string
  readonly VITE_MONEY_AUTH_URL: string
  readonly VITE_VERIFIER_SERVICE_BASE_URL: string
  readonly VITE_USDC_TOKEN_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

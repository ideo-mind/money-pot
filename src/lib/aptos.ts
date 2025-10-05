import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Environment configuration
const APTOS_NODE_URL = import.meta.env.APTOS_NODE_URL || "https://fullnode.testnet.aptoslabs.com/v1";
const MONEY_POT_CONTRACT_ADDRESS = import.meta.env.VITE_MONEY_POT_CONTRACT_ADDRESS || "0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f";

export const MODULE_ADDRESS = MONEY_POT_CONTRACT_ADDRESS;
export const MODULE_NAME = "money_pot_manager";

// Create Aptos config with custom node URL
const aptosConfig = new AptosConfig({ 
  network: Network.TESTNET,
  fullnode: APTOS_NODE_URL
});

export const aptos = new Aptos(aptosConfig);

// Export environment variables for use in other parts of the app
export const ENV_CONFIG = {
  APTOS_NODE_URL,
  MONEY_POT_CONTRACT_ADDRESS,
  MONEY_AUTH_URL: import.meta.env.MONEY_AUTH_URL || "https://auth.money-pot.unreal.art",
  VERIFIER_SERVICE_BASE_URL: import.meta.env.VITE_VERIFIER_SERVICE_BASE_URL || "",
  USDC_TOKEN_ADDRESS: import.meta.env.VITE_USDC_TOKEN_ADDRESS || "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17da",
  NODE_ENV: import.meta.env.MODE || "development"
};
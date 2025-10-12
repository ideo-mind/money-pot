import moneyPotABIJson from '@/abis/evm/MoneyPot.json';

// Export the ABI as an array (viem expects an array, not an object)
export const moneyPotABI = moneyPotABIJson.abi;
import { createPublicClient, createWalletClient, http, webSocket, defineChain } from 'viem';

// Creditcoin EVM Testnet Configuration - Hardcoded values
export const creditcoinTestnet = defineChain({
  id: 102031,
  name: 'Creditcoin Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Creditcoin',
    symbol: 'CTC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.cc3-testnet.creditcoin.network'],
      webSocket: ['wss://rpc.cc3-testnet.creditcoin.network'],
    },
    public: {
      http: ['https://rpc.cc3-testnet.creditcoin.network'],
      webSocket: ['wss://rpc.cc3-testnet.creditcoin.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Creditcoin Explorer',
      url: 'https://creditcoin-testnet.blockscout.com',
    },
  },
 custom: {
    moneypot: {
      address: "0xEC020aA4De9567Ae9dF9f43Da71414aE4932F6f3",
      abis: moneyPotABI,
      token: {
      address: "0xEC020aA4De9567Ae9dF9f43Da71414aE4932F6f3",
      symbol: "USDC",
      name: "Money Pot",
      decimals: 6,
      abis: moneyPotABI,
    },
    }

  },
  testnet: true,
});

// Contract Configuration - From chain config
export const MONEY_POT_CONTRACT_ADDRESS = creditcoinTestnet.custom.moneypot.address as `0x${string}`;
export const USDC_TOKEN_ADDRESS = creditcoinTestnet.custom.token.address as `0x${string}`;

// WalletConnect Configuration - Hardcoded
export const WALLETCONNECT_PROJECT_ID = import.meta.env.WALLETCONNECT_PROJECT_ID;

// Create public client for read operations
export const publicClient = createPublicClient({
  chain: creditcoinTestnet,
  transport: http(),
});

// Create WebSocket client for real-time updates
export const wsClient = createPublicClient({
  chain: creditcoinTestnet,
  transport: webSocket(),
});

// Helper function to create wallet client
export const createEVMWalletClient = (account: any) => {
  return createWalletClient({
    account,
    chain: creditcoinTestnet,
    transport: http(),
  });
};

// Helper function to format addresses
export const formatEVMAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to convert wei to CTC
export const formatCTC = (wei: bigint) => {
  return Number(wei) / 10 ** 18;
};

// Helper function to convert CTC to wei
export const parseCTC = (ctc: number) => {
  return BigInt(Math.floor(ctc * 10 ** 18));
};

// Export all configuration
export const EVM_CONFIG = {
  CHAIN_ID: 102031,
  CHAIN_NAME: 'Creditcoin Testnet',
  EXPLORER_URL: 'https://creditcoin-testnet.blockscout.com',
  CONTRACT_ADDRESS: MONEY_POT_CONTRACT_ADDRESS,
  USDC_TOKEN_ADDRESS,
  WALLETCONNECT_PROJECT_ID,
  NATIVE_CURRENCY: {
    name: 'Creditcoin',
    symbol: 'CTC',
    decimals: 18,
  },
  USDC_TOKEN: {
    name: 'Money Pot',
    symbol: 'USDC',
    decimals: 6,
  },
};

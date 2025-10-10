import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import walletConnectModule from '@web3-onboard/walletconnect';
import coinbaseModule from '@web3-onboard/coinbase';
import metamaskModule from '@web3-onboard/metamask';
import { EVM_CONFIG } from '@/config/viem';

// Initialize the injected wallets module
const injected = injectedModule();

// Initialize WalletConnect module
const walletConnect = walletConnectModule({
  projectId: EVM_CONFIG.WALLETCONNECT_PROJECT_ID,
  requiredChains: [EVM_CONFIG.CHAIN_ID],
  optionalChains: [EVM_CONFIG.CHAIN_ID],
});

// Initialize Coinbase module
const coinbase = coinbaseModule();

// Initialize MetaMask module
const metamask = metamaskModule({ options: {} });

// Create the onboard instance
export const onboard = Onboard({
  wallets: [injected, walletConnect, coinbase, metamask],
  chains: [
    {
      id: `0x${EVM_CONFIG.CHAIN_ID.toString(16)}`, // Convert to hex
      token: EVM_CONFIG.NATIVE_CURRENCY.symbol,
      label: EVM_CONFIG.CHAIN_NAME,
      rpcUrl: 'https://rpc.cc3-testnet.creditcoin.network',
      blockExplorerUrl: EVM_CONFIG.EXPLORER_URL,
    },
  ],
  accountCenter: {
    desktop: {
      enabled: true,
      position: 'topRight',
    },
    mobile: {
      enabled: true,
      position: 'topRight',
    },
  },
  notify: {
    enabled: true,
    transactionHandler: (transaction) => {
      console.log('Transaction:', transaction);
    },
  },
  appMetadata: {
    name: 'Money Pot',
    description: 'Decentralized money pot game',
    icon: '/logo.png',
    logo: '/logo.png',
    recommendedInjectedWallets: [
      {
        name: 'MetaMask',
        url: 'https://metamask.io',
      },
    ],
  },
});

// Helper function to connect wallet
export const connectWallet = async () => {
  try {
    const wallets = await onboard.connectWallet();
    return wallets[0];
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

// Helper function to disconnect wallet
export const disconnectWallet = async () => {
  try {
    await onboard.disconnectWallet();
  } catch (error) {
    console.error('Failed to disconnect wallet:', error);
    throw error;
  }
};

// Helper function to get connected wallet
export const getConnectedWallet = () => {
  const connectedWallets = onboard.state.get().wallets;
  return connectedWallets.length > 0 ? connectedWallets[0] : null;
};

// Helper function to switch network
export const switchNetwork = async (chainId: number) => {
  try {
    const wallet = getConnectedWallet();
    if (wallet) {
      await wallet.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    }
  } catch (error) {
    console.error('Failed to switch network:', error);
    throw error;
  }
};

// Helper function to add network if not exists
export const addNetwork = async () => {
  try {
    const wallet = getConnectedWallet();
    if (wallet) {
      await wallet.provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${EVM_CONFIG.CHAIN_ID.toString(16)}`,
            chainName: EVM_CONFIG.CHAIN_NAME,
            nativeCurrency: EVM_CONFIG.NATIVE_CURRENCY,
            rpcUrls: ['https://rpc.cc3-testnet.creditcoin.network'],
            blockExplorerUrls: [EVM_CONFIG.EXPLORER_URL],
          },
        ],
      });
    }
  } catch (error) {
    console.error('Failed to add network:', error);
    throw error;
  }
};

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { Network } from "@aptos-labs/ts-sdk";
import { PropsWithChildren, createContext, useContext, useState, useEffect } from "react";
import { onboard, getConnectedWallet } from "@/lib/web3onboard";

// Wallet types
export type WalletType = 'aptos' | 'evm';

export interface WalletState {
  type: WalletType | null;
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface WalletContextType {
  walletState: WalletState;
  connectAptos: () => Promise<void>;
  connectEVM: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToAptos: () => Promise<void>;
  switchToEVM: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

// Aptos wallets configuration
const aptosWallets = [
  new PetraWallet(),
];

export const UnifiedWalletProvider = ({ children }: PropsWithChildren) => {
  const [walletState, setWalletState] = useState<WalletState>({
    type: null,
    address: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  // Monitor EVM wallet connection
  useEffect(() => {
    const handleEVMWalletChange = () => {
      const evmWallet = getConnectedWallet();
      if (evmWallet) {
        setWalletState(prev => ({
          ...prev,
          type: 'evm',
          address: evmWallet.accounts[0]?.address || null,
          isConnected: true,
          error: null,
        }));
      } else {
        setWalletState(prev => ({
          ...prev,
          type: prev.type === 'evm' ? null : prev.type,
          address: prev.type === 'evm' ? null : prev.address,
          isConnected: prev.type === 'evm' ? false : prev.isConnected,
        }));
      }
    };

    // Subscribe to wallet changes
    const unsubscribe = onboard.state.select('wallets').subscribe(handleEVMWalletChange);
    
    // Initial check
    handleEVMWalletChange();

    return () => {
      unsubscribe.unsubscribe();
    };
  }, []);

  const connectAptos = async () => {
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // This will be handled by the AptosWalletAdapterProvider
      // The actual connection logic will be in the wallet connect button
      setWalletState(prev => ({ 
        ...prev, 
        type: 'aptos', 
        isConnected: true, 
        isLoading: false 
      }));
    } catch (error) {
      setWalletState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to connect Aptos wallet',
        isLoading: false 
      }));
    }
  };

  const connectEVM = async () => {
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const wallet = await onboard.connectWallet();
      if (wallet && wallet.accounts.length > 0) {
        setWalletState(prev => ({ 
          ...prev, 
          type: 'evm', 
          address: wallet.accounts[0].address,
          isConnected: true, 
          isLoading: false 
        }));
      }
    } catch (error) {
      setWalletState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to connect EVM wallet',
        isLoading: false 
      }));
    }
  };

  const disconnect = async () => {
    setWalletState(prev => ({ ...prev, isLoading: true }));
    try {
      if (walletState.type === 'evm') {
        await onboard.disconnectWallet();
      }
      // Aptos disconnection will be handled by the wallet adapter
      setWalletState({
        type: null,
        address: null,
        isConnected: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setWalletState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to disconnect wallet',
        isLoading: false 
      }));
    }
  };

  const switchToAptos = async () => {
    if (walletState.type === 'evm') {
      await disconnect();
    }
    await connectAptos();
  };

  const switchToEVM = async () => {
    if (walletState.type === 'aptos') {
      await disconnect();
    }
    await connectEVM();
  };

  const contextValue: WalletContextType = {
    walletState,
    connectAptos,
    connectEVM,
    disconnect,
    switchToAptos,
    switchToEVM,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      <AptosWalletAdapterProvider
        wallets={aptosWallets}
        autoConnect={false}
        dappConfig={{
          network: Network.TESTNET,
        }}
        onError={(error) => {
          console.log("Aptos wallet error", error);
          setWalletState(prev => ({ 
            ...prev, 
            error: error.message,
            isLoading: false 
          }));
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </WalletContext.Provider>
  );
};

export const useUnifiedWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useUnifiedWallet must be used within a UnifiedWalletProvider');
  }
  return context;
};

import React from 'react';
import { useUnifiedWallet } from '@/components/UnifiedWalletProvider';
import { usePotStore } from '@/store/pot-store';
import { useEVMPotStore } from '@/store/evm-pot-store';
import { evmContractService } from '@/lib/evm-api';
import { evmVerifierService, EVMVerifierServiceClient } from '@/lib/evm-verifier-api';
import { getConnectedWallet } from '@/lib/web3onboard';
import { WalletType } from '@/lib/constants';

export interface CreatePotParams {
  amount: number;
  duration: number;
  fee: number;
  password: string;
  colorMap: Record<string, string>;
}

export interface AttemptPotParams {
  potId: string;
}

export interface NetworkAdapterResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class NetworkAdapter {
  private walletType: WalletType | null = null;
  private walletAddress: string | null = null;

  setWallet(walletType: WalletType | null, address: string | null) {
    this.walletType = walletType;
    this.walletAddress = address;
  }

  async createPot(params: CreatePotParams): Promise<NetworkAdapterResult<string>> {
    if (!this.walletType || !this.walletAddress) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      if (this.walletType === 'evm') {
        return await this.createEVMPot(params);
      } else {
        return await this.createAptosPot(params);
      }
    } catch (error) {
      console.error('Failed to create pot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async createEVMPot(params: CreatePotParams): Promise<NetworkAdapterResult<string>> {
    try {
      // Create pot on EVM contract
      const potId = await evmContractService.createPot({
        amount: BigInt(params.amount * 10**6), // USDC has 6 decimals
        durationSeconds: BigInt(params.duration),
        fee: BigInt(params.fee * 10**6),
        oneFaAddress: this.walletAddress!,
      });

      // Register with verifier service
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = {
        pot_id: potId,
        "1p": params.password,
        legend: params.colorMap,
        iat: timestamp,
        iss: this.walletAddress!,
        exp: timestamp + 3600, // 1 hour
      };

      // Get encryption key
      const { public_key } = await evmVerifierService.registerOptions();
      
      // Encrypt payload
      const encryptedPayload = EVMVerifierServiceClient.encryptPayload(payload);
      
      // Create signature using the connected EVM wallet
      const message = JSON.stringify(payload);
      const evmWallet = getConnectedWallet();
      if (!evmWallet) {
        throw new Error('No EVM wallet connected');
      }
      
      const signature = await EVMVerifierServiceClient.createEVMSignature(evmWallet, message);

      // Register with verifier
      await evmVerifierService.registerVerify(
        encryptedPayload,
        public_key,
        signature
      );

      return { success: true, data: potId };
    } catch (error) {
      console.error('Failed to create EVM pot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create EVM pot' 
      };
    }
  }

  private async createAptosPot(params: CreatePotParams): Promise<NetworkAdapterResult<string>> {
    // This would integrate with the existing Aptos pot creation logic
    // For now, return an error as we need to implement this
    return { 
      success: false, 
      error: 'Aptos pot creation not yet implemented in adapter' 
    };
  }

  async attemptPot(params: AttemptPotParams): Promise<NetworkAdapterResult<string>> {
    if (!this.walletType || !this.walletAddress) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      if (this.walletType === 'evm') {
        return await this.attemptEVMPot(params);
      } else {
        return await this.attemptAptosPot(params);
      }
    } catch (error) {
      console.error('Failed to attempt pot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async attemptEVMPot(params: AttemptPotParams): Promise<NetworkAdapterResult<string>> {
    try {
      // Attempt pot on EVM contract
      const attemptId = await evmContractService.attemptPot({
        potId: BigInt(params.potId),
      });

      return { success: true, data: attemptId };
    } catch (error) {
      console.error('Failed to attempt EVM pot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to attempt EVM pot' 
      };
    }
  }

  private async attemptAptosPot(params: AttemptPotParams): Promise<NetworkAdapterResult<string>> {
    // This would integrate with the existing Aptos pot attempt logic
    return { 
      success: false, 
      error: 'Aptos pot attempt not yet implemented in adapter' 
    };
  }

  async getPot(potId: string): Promise<NetworkAdapterResult<any>> {
    if (!this.walletType) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      if (this.walletType === 'evm') {
        const pot = await evmContractService.getPot(potId);
        return { success: true, data: pot };
      } else {
        // Aptos implementation
        return { 
          success: false, 
          error: 'Aptos pot fetch not yet implemented in adapter' 
        };
      }
    } catch (error) {
      console.error('Failed to get pot:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get pot' 
      };
    }
  }

  async getActivePots(): Promise<NetworkAdapterResult<any[]>> {
    if (!this.walletType) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      if (this.walletType === 'evm') {
        const pots = await evmContractService.getActivePots();
        return { success: true, data: pots };
      } else {
        // Aptos implementation
        return { 
          success: false, 
          error: 'Aptos active pots fetch not yet implemented in adapter' 
        };
      }
    } catch (error) {
      console.error('Failed to get active pots:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get active pots' 
      };
    }
  }

  async getChallenges(attemptId: string): Promise<NetworkAdapterResult<any>> {
    if (!this.walletType || !this.walletAddress) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      if (this.walletType === 'evm') {
        // Create signature for authentication using connected EVM wallet
        const message = attemptId.toString();
        const evmWallet = getConnectedWallet();
        if (!evmWallet) {
          throw new Error('No EVM wallet connected');
        }
        
        const signature = await EVMVerifierServiceClient.createEVMSignature(evmWallet, message);

        const challenges = await evmVerifierService.authenticateOptions(attemptId, signature);
        return { success: true, data: challenges };
      } else {
        // Aptos implementation
        return { 
          success: false, 
          error: 'Aptos challenges fetch not yet implemented in adapter' 
        };
      }
    } catch (error) {
      console.error('Failed to get challenges:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get challenges' 
      };
    }
  }

  async verifySolutions(
    solutions: Array<{ challenge_id: string; answer: string }>,
    attemptId: string
  ): Promise<NetworkAdapterResult<boolean>> {
    if (!this.walletType || !this.walletAddress) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      if (this.walletType === 'evm') {
        const result = await evmVerifierService.authenticateVerify(
          solutions,
          attemptId,
          this.walletAddress
        );
        return { success: true, data: result.success };
      } else {
        // Aptos implementation
        return { 
          success: false, 
          error: 'Aptos solution verification not yet implemented in adapter' 
        };
      }
    } catch (error) {
      console.error('Failed to verify solutions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to verify solutions' 
      };
    }
  }
}

// Hook to use the network adapter
export const useNetworkAdapter = () => {
  const { walletState } = useUnifiedWallet();
  const aptosStore = usePotStore();
  const evmStore = useEVMPotStore();
  
  const adapter = new NetworkAdapter();
  
  // Set wallet info when wallet state changes
  React.useEffect(() => {
    if (walletState?.type && walletState?.address) {
      adapter.setWallet(walletState.type, walletState.address);
    }
  }, [walletState]);

  // Get the appropriate store based on wallet type
  const getStore = () => {
    if (walletState?.type === 'evm') {
      return evmStore;
    }
    return aptosStore;
  };

  return {
    adapter,
    store: getStore(),
    walletType: walletState?.type || null,
    walletAddress: walletState?.address || null,
  };
};

export default NetworkAdapter;

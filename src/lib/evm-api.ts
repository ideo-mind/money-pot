import { publicClient, createEVMWalletClient, parseCTC, formatCTC } from '@/config/viem';
import { contractFunctions, formatPotData, stringToBytes32, PotData, CreatePotParams, AttemptPotParams } from '@/abis/evm/money-pot';
import { Address } from 'viem';

export interface EVMPot {
  id: string;
  creator: string;
  total_usdc: string;
  entry_fee: string;
  created_at: string;
  expires_at: Date;
  is_active: boolean;
  attempts_count: string;
  one_fa_address: string;
  // UI-specific, transformed fields
  title: string;
  totalValue: number;
  entryFee: number;
  potentialReward: number;
  timeLeft: string;
  isExpired: boolean;
  creatorAvatar: string;
  creatorUsername: string;
  difficulty: number;
}

export interface EVMTransaction {
  hash: string;
  type: 'create_pot' | 'attempt_pot' | 'expire_pot';
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  description: string;
  potId?: string;
  amount?: string;
  error?: string;
}

class EVMContractService {
  private walletClient: any = null;

  setWalletClient(account: any) {
    this.walletClient = createEVMWalletClient(account);
  }

  // Create a new pot
  async createPot(params: CreatePotParams): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await this.walletClient.writeContract({
        ...contractFunctions.createPot,
        args: [params.entryFee, params.duration],
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        // Extract pot ID from logs (assuming PotCreated event)
        const potCreatedLog = receipt.logs.find(log => 
          log.topics[0] === '0x...' // Replace with actual event signature
        );
        
        if (potCreatedLog) {
          const potId = BigInt(potCreatedLog.topics[1]);
          return potId.toString();
        }
      }

      throw new Error('Transaction failed');
    } catch (error) {
      console.error('Failed to create pot:', error);
      throw error;
    }
  }

  // Attempt to solve a pot
  async attemptPot(params: AttemptPotParams): Promise<boolean> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const passwordBytes32 = stringToBytes32(params.password);
      
      const hash = await this.walletClient.writeContract({
        ...contractFunctions.attemptPot,
        args: [params.potId, passwordBytes32],
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        // Extract success result from logs (assuming PotAttempted event)
        const attemptLog = receipt.logs.find(log => 
          log.topics[0] === '0x...' // Replace with actual event signature
        );
        
        if (attemptLog) {
          return attemptLog.data === '0x0000000000000000000000000000000000000000000000000000000000000001';
        }
      }

      throw new Error('Transaction failed');
    } catch (error) {
      console.error('Failed to attempt pot:', error);
      throw error;
    }
  }

  // Get pot data
  async getPot(potId: string): Promise<PotData | null> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.getPot,
        args: [BigInt(potId)],
      });

      return formatPotData(result);
    } catch (error) {
      console.error('Failed to get pot:', error);
      return null;
    }
  }

  // Get user balance
  async getBalance(address: Address): Promise<number> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.getBalance,
        args: [address],
      });

      return Number(result) / 10 ** 6; // Assuming USDC has 6 decimals
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  // Get attempts count for a pot
  async getAttemptsCount(potId: string): Promise<number> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.getAttemptsCount,
        args: [BigInt(potId)],
      });

      return Number(result);
    } catch (error) {
      console.error('Failed to get attempts count:', error);
      return 0;
    }
  }

  // Expire a pot
  async expirePot(potId: string): Promise<void> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await this.walletClient.writeContract({
        ...contractFunctions.expirePot,
        args: [BigInt(potId)],
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });
    } catch (error) {
      console.error('Failed to expire pot:', error);
      throw error;
    }
  }

  // Withdraw funds
  async withdraw(amount: number): Promise<void> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const amountWei = BigInt(Math.floor(amount * 10 ** 6)); // Assuming USDC has 6 decimals
      
      const hash = await this.walletClient.writeContract({
        ...contractFunctions.withdraw,
        args: [amountWei],
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });
    } catch (error) {
      console.error('Failed to withdraw:', error);
      throw error;
    }
  }

  // Deposit funds
  async deposit(amount: number): Promise<void> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const amountWei = BigInt(Math.floor(amount * 10 ** 6)); // Assuming USDC has 6 decimals
      
      const hash = await this.walletClient.writeContract({
        ...contractFunctions.deposit,
        args: [amountWei],
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });
    } catch (error) {
      console.error('Failed to deposit:', error);
      throw error;
    }
  }

  // Transform pot data for UI
  transformPotData(potData: PotData, potId: string): EVMPot {
    const now = new Date();
    const expiresAt = new Date(Number(potData.expiresAt) * 1000);
    const isExpired = now > expiresAt;
    
    const timeLeft = isExpired ? 'Expired' : this.calculateTimeLeft(expiresAt);
    
    return {
      id: potId,
      creator: potData.creator,
      total_usdc: potData.totalUsdc.toString(),
      entry_fee: potData.entryFee.toString(),
      created_at: potData.createdAt.toString(),
      expires_at: expiresAt,
      is_active: potData.isActive,
      attempts_count: potData.attemptsCount.toString(),
      one_fa_address: potData.oneFaAddress,
      title: `Pot #${potId}`,
      totalValue: Number(potData.totalUsdc) / 10 ** 6,
      entryFee: Number(potData.entryFee) / 10 ** 6,
      potentialReward: Number(potData.totalUsdc) / 10 ** 6,
      timeLeft,
      isExpired,
      creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${potData.creator}`,
      creatorUsername: formatAddress(potData.creator),
      difficulty: Math.min(Number(potData.attemptsCount) + 1, 10),
    };
  }

  private calculateTimeLeft(expiresAt: Date): string {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}

// Export singleton instance
export const evmContractService = new EVMContractService();

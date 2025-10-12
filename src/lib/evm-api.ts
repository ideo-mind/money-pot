import { publicClient, createEVMWalletClient, parseCTC, formatCTC } from '@/config/viem';
import { 
  contractFunctions, 
  formatPotData, 
  formatAttemptData,
  MoneyPotData, 
  AttemptData,
  CreatePotParams, 
  AttemptPotParams 
} from '@/abis/evm/money-pot';
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
        args: [params.amount, params.durationSeconds, params.fee, params.oneFaAddress],
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        // Extract pot ID from PotCreated event
        const potCreatedLog = receipt.logs.find(log => 
          log.topics[0] === '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925' // PotCreated event signature
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

  // Attempt to solve a pot (returns attempt ID)
  async attemptPot(params: AttemptPotParams): Promise<string> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await this.walletClient.writeContract({
        ...contractFunctions.attemptPot,
        args: [params.potId],
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        // Extract attempt ID from PotAttempted event
        const attemptLog = receipt.logs.find(log => 
          log.topics[0] === '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925' // PotAttempted event signature
        );
        
        if (attemptLog) {
          const attemptId = BigInt(attemptLog.topics[1]);
          return attemptId.toString();
        }
      }

      throw new Error('Transaction failed');
    } catch (error) {
      console.error('Failed to attempt pot:', error);
      throw error;
    }
  }

  // Get pot data by ID
  async getPot(potId: string): Promise<MoneyPotData | null> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.getPot,
        args: [BigInt(potId)],
      });

      return formatPotData(result as MoneyPotData);
    } catch (error) {
      console.error('Failed to get pot:', error);
      return null;
    }
  }

  // Get user's USDC balance
  async getBalance(address: Address): Promise<number> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.getBalance,
        args: [address],
      });

      return Number(result) / 10 ** 6; // USDC has 6 decimals
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  // Get all active pot IDs
  async getActivePots(): Promise<string[]> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.getActivePots,
      });

      return (result as bigint[]).map(id => id.toString());
    } catch (error) {
      console.error('Failed to get active pots:', error);
      return [];
    }
  }

  // Get all pot IDs
  async getPots(): Promise<string[]> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.getPots,
      });

      return (result as bigint[]).map(id => id.toString());
    } catch (error) {
      console.error('Failed to get pots:', error);
      return [];
    }
  }

  // Get attempt data by ID
  async getAttempt(attemptId: string): Promise<AttemptData | null> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.getAttempt,
        args: [BigInt(attemptId)],
      });

      return formatAttemptData(result as AttemptData);
    } catch (error) {
      console.error('Failed to get attempt:', error);
      return null;
    }
  }

  // Mark attempt as completed (oracle function)
  async attemptCompleted(attemptId: string, status: boolean): Promise<void> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await this.walletClient.writeContract({
        ...contractFunctions.attemptCompleted,
        args: [BigInt(attemptId), status],
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash });
    } catch (error) {
      console.error('Failed to mark attempt completed:', error);
      throw error;
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

  // Get next pot ID
  async getNextPotId(): Promise<number> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.nextPotId,
      });

      return Number(result);
    } catch (error) {
      console.error('Failed to get next pot ID:', error);
      return 0;
    }
  }

  // Get next attempt ID
  async getNextAttemptId(): Promise<number> {
    try {
      const result = await publicClient.readContract({
        ...contractFunctions.nextAttemptId,
      });

      return Number(result);
    } catch (error) {
      console.error('Failed to get next attempt ID:', error);
      return 0;
    }
  }

  // Transform pot data for UI
  transformPotData(potData: MoneyPotData): EVMPot {
    const now = new Date();
    const expiresAt = new Date(Number(potData.expiresAt) * 1000);
    const isExpired = now > expiresAt;
    
    const timeLeft = isExpired ? 'Expired' : this.calculateTimeLeft(expiresAt);
    
    return {
      id: potData.id.toString(),
      creator: potData.creator,
      total_usdc: potData.totalAmount.toString(),
      entry_fee: potData.fee.toString(),
      created_at: potData.createdAt.toString(),
      expires_at: expiresAt,
      is_active: potData.isActive,
      attempts_count: potData.attemptsCount.toString(),
      one_fa_address: potData.oneFaAddress,
      title: `Pot #${potData.id}`,
      totalValue: Number(potData.totalAmount) / 10 ** 6,
      entryFee: Number(potData.fee) / 10 ** 6,
      potentialReward: Number(potData.totalAmount) / 10 ** 6,
      timeLeft,
      isExpired,
      creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${potData.creator}`,
      creatorUsername: this.formatAddress(potData.creator),
      difficulty: Math.min(Number(potData.attemptsCount) + 1, 10),
    };
  }

  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

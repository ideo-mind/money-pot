import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { evmVerifierService, EVMVerifierServiceClient } from '@/lib/evm-verifier-api';
import { creditcoinTestnet } from '@/config/viem';

export interface AirdropResult {
  success: boolean;
  message?: string;
  transactionHash?: string;
  error?: string;
}

export interface AirdropParams {
  amount?: number;
  message?: string;
}

class EVMFaucetService {
  private baseUrl: string;
  private chainId: number;

  constructor(baseUrl: string = 'https://auth.money-pot.unreal.art', chainId: number = 102031) {
    this.baseUrl = baseUrl;
    this.chainId = chainId;
  }

  /**
   * Request airdrop for CTC and USDC tokens
   * @param params - Airdrop parameters
   * @returns Promise<AirdropResult>
   */
  async requestAirdrop(params: AirdropParams = {}): Promise<AirdropResult> {
    try {
      const {
        amount = 200, // Default amount as per documentation
        message = "Claim airdrop"
      } = params;

      // Generate random wallet for airdrop request
      const randomAccount = privateKeyToAccount(
        `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      );

      // Create wallet client
      const walletClient = createWalletClient({
        account: randomAccount,
        chain: creditcoinTestnet,
        transport: http(),
      });

      const address = randomAccount.address;
      const currentTime = Math.floor(Date.now() / 1000);

      // Create airdrop payload
      const payload = {
        amount,
        message,
        iat: currentTime,
        iss: address,
        exp: currentTime + 3600, // 1 hour
      };

      // Sign the payload using the generated wallet
      const messageString = JSON.stringify(payload);
      const signature = await walletClient.signMessage({
        message: messageString,
      });

      // Convert payload to hex-encoded string (as expected by middleware)
      const encryptedPayload = Buffer.from(messageString, 'utf-8').toString('hex');

      // Request airdrop from verifier service
      const result = await evmVerifierService.airdrop(encryptedPayload, signature);

      if (result.success) {
        return {
          success: true,
          message: result.message || 'Airdrop successful',
          transactionHash: result.data?.transactionHash,
        };
      } else {
        return {
          success: false,
          error: result.message || 'Airdrop failed',
        };
      }
    } catch (error) {
      console.error('Airdrop request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if airdrop is available for the current network
   * @returns boolean
   */
  isAirdropAvailable(): boolean {
    // Only available for Creditcoin EVM testnet
    return this.chainId === 102031;
  }

  /**
   * Get airdrop information
   * @returns object with airdrop details
   */
  getAirdropInfo() {
    return {
      available: this.isAirdropAvailable(),
      amount: 200,
      tokens: ['CTC', 'USDC'],
      network: 'Creditcoin Testnet',
      chainId: this.chainId,
    };
  }
}

export const evmFaucetService = new EVMFaucetService();
export default EVMFaucetService;

export interface Pot {
  id: string;
  creator: string;
  total_usdc: string; // u64 can be large, use string
  entry_fee: string; // u64 can be large, use string
  created_at: string; // u64 can be large, use string
  expires_at: Date; // Converted to Date object for proper handling
  is_active: boolean;
  attempts_count: string; // u64 can be large, use string
  one_fa_address: string;
  one_fa_private_key?: string; // Optional: For mock data pre-fill
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

export interface Attempt {
  potId: string;
  potTitle: string;
  status: 'won' | 'lost';
  date: string; // ISO string
}

export interface LeaderboardUser {
  rank: number;
  avatar: string;
  username: string;
  amount: number;
}

export interface Transaction {
  id: string;
  hash: string;
  type: 'create_pot' | 'attempt_pot' | 'expire_pot';
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  description: string;
  potId?: string;
  amount?: string;
  error?: string;
}

// Aptos Integration Types
export interface AptosAccount {
  accountAddress: string;
  privateKey?: string;
}

export interface PotCreationParams {
  amount: number;
  durationSeconds: number;
  fee: number;
  oneFaAddress: string;
}

export interface PotAttemptParams {
  potId: number;
}

export interface PotEvent {
  type: string;
  data: {
    event_type: string;
    id: string;
    [key: string]: any;
  };
}

export interface VerifierServiceConfig {
  baseUrl: string;
  colors: Record<string, string>;
  directions: Record<string, string>;
  legend: Record<string, string>;
}

export interface ChallengeSolution {
  challengeId: string;
  solutions: string[];
}

export interface AuthenticationResult {
  success: boolean;
  message?: string;
  data?: any;
}

// Enhanced API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BlockchainTransaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  events: PotEvent[];
  timestamp: number;
}

export interface PotCreationResult {
  potId: number;
  transactionHash: string;
  events: PotEvent[];
}

export interface PotAttemptResult {
  attemptId: number;
  transactionHash: string;
  events: PotEvent[];
}
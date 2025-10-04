export interface Pot {
  id: string;
  creator: string;
  total_usdc: string; // u64 can be large, use string
  entry_fee: string; // u64 can be large, use string
  created_at: string; // u64 can be large, use string
  expires_at: string; // u64 can be large, use string
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
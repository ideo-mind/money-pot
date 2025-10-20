// EVM Contract ABI types and utilities
import { MONEY_POT_CONTRACT_ADDRESS, USDC_TOKEN_ADDRESS, moneyPotABI } from '@/config/viem';
import { Address } from 'viem';

// Contract addresses - imported from viem config
export { MONEY_POT_CONTRACT_ADDRESS, USDC_TOKEN_ADDRESS };

// Contract ABI - imported from viem config
export { moneyPotABI };

// Contract interaction utilities based on actual MoneyPot.sol
export interface MoneyPotData {
  id: bigint;
  creator: Address;
  totalAmount: bigint;
  fee: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  isActive: boolean;
  attemptsCount: bigint;
  oneFaAddress: Address;
}

export interface AttemptData {
  id: bigint;
  potId: bigint;
  hunter: Address;
  expiresAt: bigint;
  difficulty: bigint;
  isCompleted: boolean;
}

export interface CreatePotParams {
  amount: bigint; // Total amount in USDC (6 decimals)
  durationSeconds: bigint; // Duration in seconds
  fee: bigint; // Entry fee in USDC (6 decimals)
  oneFaAddress: Address; // 1Password address
}

export interface AttemptPotParams {
  potId: bigint;
}

// Helper function to format pot data from contract response
export const formatPotData = (rawData: MoneyPotData): MoneyPotData => {
  return {
    id: rawData.id,
    creator: rawData.creator,
    totalAmount: rawData.totalAmount,
    fee: rawData.fee,
    createdAt: rawData.createdAt,
    expiresAt: rawData.expiresAt,
    isActive: rawData.isActive,
    attemptsCount: rawData.attemptsCount,
    oneFaAddress: rawData.oneFaAddress,
  };
};

// Helper function to format attempt data from contract response
export const formatAttemptData = (rawData: AttemptData): AttemptData => {
  return {
    id: rawData.id,
    potId: rawData.potId,
    hunter: rawData.hunter,
    expiresAt: rawData.expiresAt,
    difficulty: rawData.difficulty,
    isCompleted: rawData.isCompleted,
  };
};

// Contract function wrappers based on actual ABI
export const contractFunctions = {
  // Create a new pot
  createPot: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'createPot',
  },
  
  // Attempt to solve a pot (returns attempt ID)
  attemptPot: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'attemptPot',
  },
  
  // Get pot data by ID
  getPot: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'getPot',
  },
  
  // Get user's USDC balance
  getBalance: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'getBalance',
  },
  
  // Get all active pot IDs
  getActivePots: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'getActivePots',
  },
  
  // Get all pot IDs
  getPots: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'getPots',
  },
  
  // Get attempt data by ID
  getAttempt: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'getAttempt',
  },
  
  // Mark attempt as completed (oracle function)
  attemptCompleted: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'attemptCompleted',
  },
  
  // Expire a pot
  expirePot: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'expirePot',
  },
  
  // Get next pot ID
  nextPotId: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'nextPotId',
  },
  
  // Get next attempt ID
  nextAttemptId: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'nextAttemptId',
  },
};

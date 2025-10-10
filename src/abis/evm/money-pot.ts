// EVM Contract ABI types and utilities
import { MONEY_POT_CONTRACT_ADDRESS, USDC_TOKEN_ADDRESS, moneyPotABI } from '@/config/viem';
import { Address } from 'viem';

// Contract addresses - imported from viem config
export { MONEY_POT_CONTRACT_ADDRESS, USDC_TOKEN_ADDRESS };

// Contract ABI - imported from viem config
export { moneyPotABI };

// Contract interaction utilities
export interface PotData {
  creator: Address;
  totalUsdc: bigint;
  entryFee: bigint;
  createdAt: bigint;
  expiresAt: bigint;
  isActive: boolean;
  attemptsCount: bigint;
  oneFaAddress: Address;
}

export interface CreatePotParams {
  entryFee: bigint;
  duration: bigint; // in seconds
}

export interface AttemptPotParams {
  potId: bigint;
  password: string; // This will be hashed to bytes32
}

// Helper function to convert string to bytes32
export const stringToBytes32 = (str: string): `0x${string}` => {
  const bytes = new TextEncoder().encode(str);
  const hex = Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex.padEnd(64, '0')}` as `0x${string}`;
};

// Helper function to format pot data
export const formatPotData = (rawData: any[]): PotData => {
  return {
    creator: rawData[0] as Address,
    totalUsdc: rawData[1] as bigint,
    entryFee: rawData[2] as bigint,
    createdAt: rawData[3] as bigint,
    expiresAt: rawData[4] as bigint,
    isActive: rawData[5] as boolean,
    attemptsCount: rawData[6] as bigint,
    oneFaAddress: rawData[7] as Address,
  };
};

// Contract function wrappers
export const contractFunctions = {
  createPot: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'createPot',
  },
  attemptPot: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'attemptPot',
  },
  getPot: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'getPot',
  },
  getBalance: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'getBalance',
  },
  getAttemptsCount: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'getAttemptsCount',
  },
  expirePot: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'expirePot',
  },
  withdraw: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'withdraw',
  },
  deposit: {
    abi: moneyPotABI,
    address: MONEY_POT_CONTRACT_ADDRESS,
    functionName: 'deposit',
  },
};

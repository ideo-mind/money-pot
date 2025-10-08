import { Network } from "@aptos-labs/ts-sdk";

export interface NetworkInfo {
  name?: string;
  chainId?: string;
}

/**
 * Validates if the current network is Aptos Testnet
 * @param network - Network information from wallet
 * @returns true if on testnet, false otherwise
 */
export function isTestnet(network: NetworkInfo | null | undefined): boolean {
  if (!network) return false;
  
  const name = network.name?.toLowerCase() || '';
  const chainId = network.chainId;
  
  // Check by name patterns
  const isTestnetByName = name.includes('testnet') || 
                         name.includes('test') ||
                         name.includes('devnet');
  
  // Check by chain ID (Aptos testnet chain ID is typically '2')
  const isTestnetByChainId = chainId === '2';
  
  return isTestnetByName || isTestnetByChainId;
}

/**
 * Validates network and throws error if not on testnet
 * @param network - Network information from wallet
 * @throws Error if not on testnet
 */
export function validateTestnet(network: NetworkInfo | null | undefined): void {
  if (!isTestnet(network)) {
    throw new Error(
      `Wrong network detected. Please switch to Aptos Testnet. Current network: ${network?.name || 'Unknown'}`
    );
  }
}

/**
 * Gets a user-friendly network name
 * @param network - Network information from wallet
 * @returns Formatted network name
 */
export function getNetworkDisplayName(network: NetworkInfo | null | undefined): string {
  if (!network) return 'Unknown Network';
  
  const name = network.name || 'Unknown';
  const isTest = isTestnet(network);
  
  return `${name} ${isTest ? '✅' : '❌'}`;
}


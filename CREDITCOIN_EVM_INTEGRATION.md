# Creditcoin EVM Integration

This document outlines the integration of Creditcoin EVM testnet support into the Money Pot application.

## Overview

The application now supports both Aptos and EVM (Creditcoin) networks, allowing users to connect with either wallet type and interact with the respective smart contracts.

## Network Configuration

### Creditcoin EVM Testnet

- **Chain ID**: 102031
- **RPC URL**: https://rpc.cc3-testnet.creditcoin.network
- **WebSocket URL**: wss://rpc.cc3-testnet.creditcoin.network
- **Explorer**: https://creditcoin-testnet.blockscout.com
- **Native Currency**: CTC (Creditcoin)
- **Decimals**: 18

## Architecture

### Key Components

1. **UnifiedWalletProvider** (`src/components/UnifiedWalletProvider.tsx`)
   - Manages both Aptos and EVM wallet connections
   - Provides unified wallet state management
   - Handles wallet switching between networks

2. **UnifiedWalletConnectButton** (`src/components/UnifiedWalletConnectButton.tsx`)
   - Single UI component for both wallet types
   - Shows appropriate balances (APT/USDC for Aptos, CTC for EVM)
   - Network switching capabilities

3. **EVM Configuration** (`src/config/viem.ts`)
   - Centralized Creditcoin testnet configuration
   - All values hardcoded (no environment variables)
   - Public and WebSocket clients
   - Utility functions for address formatting and currency conversion

4. **Web3Onboard Integration** (`src/lib/web3onboard.ts`)
   - Wallet connection management for EVM
   - Support for MetaMask, WalletConnect, Coinbase, and injected wallets
   - Network switching and addition

5. **EVM Contract Service** (`src/lib/evm-api.ts`)
   - Contract interaction layer for EVM
   - Similar API to Aptos contract interactions
   - Transaction management and state updates

6. **EVM ABI Structure** (`src/abis/evm/money-pot.ts`)
   - Contract ABI definitions
   - Type-safe contract interactions
   - Event handling and data transformation

## Configuration

All EVM configuration is centralized in `src/config/viem.ts`. Contract addresses are defined in the chain configuration.

**To update configuration:**

1. Edit `src/config/viem.ts`
2. Update contract addresses in `creditcoinTestnet.custom.moneypot.address` and `creditcoinTestnet.custom.token.address`
3. Set `VITE_WALLETCONNECT_PROJECT_ID` in your environment

## Usage

### Connecting Wallets

Users can now connect either:

- **Aptos Wallets**: Petra, Martian, etc.
- **EVM Wallets**: MetaMask, WalletConnect, Coinbase, etc.

The unified wallet button shows:

- Current wallet type (APTOS/EVM)
- Wallet address
- Network status
- Appropriate balances
- Option to switch between wallet types

### Contract Interactions

The EVM contract service provides the same interface as the Aptos service:

```typescript
import { evmContractService } from "@/lib/evm-api"

// Create a pot
const potId = await evmContractService.createPot({
  amount: BigInt(100 * 10 ** 6), // 100 USDC (6 decimals)
  durationSeconds: BigInt(86400), // 24 hours
  fee: BigInt(10 * 10 ** 6), // 10 USDC entry fee
  oneFaAddress: "0x...", // 1Password address
})

// Attempt a pot (returns attempt ID)
const attemptId = await evmContractService.attemptPot({
  potId: BigInt(potId),
})

// Get pot data
const potData = await evmContractService.getPot(potId)

// Get user's USDC balance
const balance = await evmContractService.getBalance(userAddress)

// Get all active pots
const activePots = await evmContractService.getActivePots()
```

## Contract Integration Status

✅ **Fully Integrated Functions:**

- `getBalance(address)` - Get user's USDC balance
- `createPot(amount, durationSeconds, fee, oneFaAddress)` - Create new pot
- `attemptPot(potId)` - Attempt to solve pot (returns attempt ID)
- `getPot(potId)` - Get pot data by ID
- `getActivePots()` - Get all active pot IDs
- `getPots()` - Get all pot IDs
- `getAttempt(attemptId)` - Get attempt data
- `attemptCompleted(attemptId, status)` - Mark attempt as completed (oracle)
- `expirePot(potId)` - Expire a pot
- `nextPotId()` - Get next pot ID
- `nextAttemptId()` - Get next attempt ID

✅ **Contract ABI:** Using actual MoneyPot.json ABI
✅ **Event Handling:** PotCreated, PotAttempted, PotSolved, PotFailed events
✅ **Type Safety:** Full TypeScript support with proper interfaces

## Network Switching

The application automatically handles network switching:

- **Aptos**: Switches to Aptos Testnet
- **EVM**: Adds Creditcoin Testnet if not present, then switches to it

## Error Handling

The integration includes comprehensive error handling for:

- Network mismatches
- Transaction failures
- Wallet connection issues
- Contract interaction errors

## Testing

To test the EVM integration:

1. Set `VITE_WALLETCONNECT_PROJECT_ID` in your environment
2. Update contract addresses in `src/config/viem.ts`
3. Deploy the contract to Creditcoin testnet
4. Connect an EVM wallet (MetaMask recommended)
5. Test contract interactions

## Future Enhancements

- Multi-network support (multiple EVM chains)
- Cross-chain pot creation
- Unified transaction history
- Network-specific UI adaptations

## Dependencies Added

- `viem`: Ethereum library for contract interactions
- `@web3-onboard/react`: React hooks for Web3Onboard
- `@web3-onboard/core`: Core Web3Onboard functionality
- `@web3-onboard/injected-wallets`: Injected wallet support
- `@web3-onboard/walletconnect`: WalletConnect integration
- `@web3-onboard/coinbase`: Coinbase wallet support
- `@web3-onboard/metamask`: MetaMask integration

## Notes

- The EVM integration maintains the same user experience as Aptos
- All existing Aptos functionality remains unchanged
- The unified wallet system allows seamless switching between networks
- Contract ABI placeholders are ready for your actual contract deployment

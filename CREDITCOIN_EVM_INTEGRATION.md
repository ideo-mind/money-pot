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

All EVM configuration is hardcoded in `src/config/viem.ts`. No environment variables needed for EVM setup.

**To update configuration:**

1. Edit `src/config/viem.ts`
2. Update `WALLETCONNECT_PROJECT_ID` with your actual project ID
3. Update `MONEY_POT_CONTRACT_ADDRESS` with your deployed contract address

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
  entryFee: parseCTC(10), // 10 CTC
  duration: BigInt(86400), // 24 hours
})

// Attempt a pot
const success = await evmContractService.attemptPot({
  potId: BigInt(potId),
  password: "user_password",
})

// Get pot data
const potData = await evmContractService.getPot(potId)
```

## Contract ABI Integration

When you provide the actual contract ABI, update the following files:

1. **`src/config/viem.ts`**
   - Update `WALLETCONNECT_PROJECT_ID` with your actual project ID
   - Update `MONEY_POT_CONTRACT_ADDRESS` with your deployed contract address

2. **`src/abis/evm/money-pot.ts`**
   - Replace placeholder ABI with actual contract ABI
   - Adjust function signatures and return types

3. **`src/lib/evm-api.ts`**
   - Update function implementations to match actual contract
   - Adjust event parsing logic
   - Update data transformation functions

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

1. Update WalletConnect Project ID in `src/config/viem.ts`
2. Update contract address in `src/config/viem.ts`
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

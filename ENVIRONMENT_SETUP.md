# Money Pot Environment Configuration

## ✅ Fixed Issues

### 1. ABI Import Error

**Problem**: `Cannot read properties of undefined (reading 'createPotEntry')`

**Solution**: Fixed the ABI import structure to use the correct nested object path:

```typescript
// Before (incorrect)
import * as money_pot_manager from "@/abis/0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f"

// After (correct)
import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from "@/abis"
```

**Usage Pattern**:

```typescript
await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.entry.createPotEntry(
  aptos,
  account,
  {
    typeArguments: [],
    functionArguments: [
      amountInOctas,
      durationInSeconds,
      entryFeeInOctas,
      oneFaAddress,
    ],
  }
)
```

### 2. Environment Variables Configuration

**Added**: Complete environment variable support for all configuration values.

## 📁 Environment Files Created

### 1. `env.example`

Template file with all required environment variables:

```bash
# Aptos Configuration
APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
MONEY_POT_CONTRACT_ADDRESS=0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f

# Verifier Service Configuration
VERIFIER_SERVICE_URL=http://localhost:8787
VERIFIER_SERVICE_BASE_URL=/api

# USDC Token Configuration
USDC_TOKEN_ADDRESS=0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17da
```

### 2. `development.env`

Development environment variables for Vite:

```bash
VITE_APTOS_NODE_URL=https://fullnode.testnet.aptoslabs.com/v1
VITE_MONEY_POT_CONTRACT_ADDRESS=0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f
VITE_VERIFIER_SERVICE_URL=http://localhost:8787
VITE_VERIFIER_SERVICE_BASE_URL=/api
VITE_USDC_TOKEN_ADDRESS=0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17da
```

## 🔧 Configuration Updates

### 1. `src/lib/aptos.ts`

- Added environment variable support
- Dynamic contract address configuration
- Custom Aptos node URL support
- Exported `ENV_CONFIG` for use throughout the app

### 2. `src/lib/api.ts`

- Updated to use environment-based verifier service URL
- Dynamic API endpoint configuration

### 3. `worker/core-utils.ts`

- Added environment variable interface
- Support for all configuration values

### 4. `worker/userRoutes.ts`

- Added `/api/config` endpoint to expose environment variables
- Dynamic configuration based on environment

### 5. `wrangler.toml`

- Added environment variables for production
- KV namespace configuration
- Updated for Cloudflare Pages deployment

### 6. `vite.config.ts`

- Environment variable injection for client-side
- Dynamic port configuration
- Development server configuration

## 🚀 Setup Instructions

### 1. Quick Setup

```bash
# Run the setup script
./setup-env.sh

# Or manually:
cp env.example .env
# Edit .env with your actual values
```

### 2. Development Environment

```bash
# Copy development environment
cp development.env .env.development

# Start development server
bun run dev
```

### 3. KV Namespace Setup

```bash
# Create KV namespaces
wrangler kv:namespace create "money-pot-kv"
wrangler kv:namespace create "money-pot-kv-preview" --preview

# Update wrangler.toml with the returned IDs
```

### 4. Testing

```bash
# Test ABI imports
node test-abi.js

# Test integration
node test-integration.js
```

## 🔍 Environment Variables Reference

### Frontend (Vite) Variables

- `VITE_APTOS_NODE_URL` - Aptos RPC endpoint
- `VITE_MONEY_POT_CONTRACT_ADDRESS` - Smart contract address
- `VITE_VERIFIER_SERVICE_URL` - Verifier service URL
- `VITE_VERIFIER_SERVICE_BASE_URL` - API base path
- `VITE_USDC_TOKEN_ADDRESS` - USDC token contract address

### Backend (Worker) Variables

- `APTOS_NODE_URL` - Aptos RPC endpoint
- `MONEY_POT_CONTRACT_ADDRESS` - Smart contract address
- `VERIFIER_SERVICE_URL` - Verifier service URL
- `USDC_TOKEN_ADDRESS` - USDC token contract address
- `NODE_ENV` - Environment (development/production)

## 🎯 Contract Integration

### Available Functions

- `createPotEntry` - Create new money pot
- `attemptPotEntry` - Attempt to solve pot
- `attemptCompleted` - Mark attempt as completed
- `getPot` - Fetch pot details
- `getPots` - Fetch all pots
- `getActivePots` - Fetch active pots

### Usage Example

```typescript
import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from "@/abis"

// Create pot
const response =
  await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.entry.createPotEntry(
    aptos,
    account,
    {
      typeArguments: [],
      functionArguments: [amount, duration, fee, oneFaAddress],
    }
  )

// Get pot
const [pot] =
  await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getPot(
    aptos,
    {
      functionArguments: [BigInt(potId)],
    }
  )
```

## ✅ Status

- ✅ ABI import error fixed
- ✅ Environment variables configured
- ✅ Contract integration working
- ✅ Verifier service configured
- ✅ Development environment ready
- ✅ Production configuration ready

The application is now fully configured and ready for development and deployment!

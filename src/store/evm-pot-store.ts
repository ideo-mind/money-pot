import { create } from 'zustand';
import { Pot, Attempt } from '@/types';
import { evmContractService } from '@/lib/evm-api';
import { formatDistanceToNowStrict } from 'date-fns';
import { MoneyPotData } from '@/abis/evm/money-pot';

const EVM_ATTEMPTS_STORAGE_KEY = 'evm-money-pot-attempts';
const EVM_POTS_STORAGE_KEY = 'evm-money-pot-pots';
const EVM_POTS_METADATA_KEY = 'evm-money-pot-metadata';

interface EVMPotMetadata {
  lastFetch: number;
  totalPots: number;
  fetchedPots: number;
  allPotIds: string[];
}

interface EVMPotState {
  pots: Record<string, Pot>;
  sortedPots: Pot[];
  currentPot: Pot | null;
  attempts: Attempt[];
  loading: boolean;
  error: string | null;
  hasMorePots: boolean;
  currentBatch: number;
  totalPots: number;
  fetchPots: (forceRefresh?: boolean) => Promise<void>;
  fetchNextBatch: () => Promise<void>;
  fetchPotById: (id: string) => Promise<void>;
  getPotById: (id: string) => Pot | undefined;
  addAttempt: (attempt: Attempt) => void;
  addPot: (pot: Pot) => void;
  clearCache: () => void;
  expirePot: (potId: string) => Promise<boolean>;
  expireAllPots: (potIds: string[]) => Promise<{ success: number; failed: number }>;
}

// Transform EVM MoneyPotData to UI Pot format
export const transformEVMPotToPot = (evmPot: MoneyPotData): Pot => {
  const totalValue = Number(evmPot.totalAmount) / 1_000_000; // USDC has 6 decimals
  const entryFee = Number(evmPot.fee) / 1_000_000;
  const potentialReward = totalValue * 0.4;
  
  let expiresAt: Date;

  try {
    const raw = evmPot.expiresAt;
    let timestamp: number;

    if (raw == null) throw new Error('Missing expiresAt');

    // Handle BigInt or number
    if (typeof raw === 'bigint') {
      timestamp = Number(raw);
    } else if (typeof raw === 'number') {
      timestamp = raw;
    } else {
      timestamp = Number(raw.toString());
    }

    // Convert seconds to milliseconds if needed
    if (timestamp < 1e12) timestamp *= 1000;

    expiresAt = new Date(timestamp);
  } catch (error) {
    console.error('Error parsing EVM expiration date:', error);
    // fallback: +24h
    expiresAt = new Date(Date.now() + 86_400_000);
  }

  const isExpired = expiresAt < new Date();
  const timeLeft = isExpired
    ? `Expired ${formatDistanceToNowStrict(expiresAt, { addSuffix: true })}`
    : formatDistanceToNowStrict(expiresAt, { addSuffix: true });
  
  const difficulty = Math.min(Number(evmPot.attemptsCount) % 11 + 2, Number(evmPot.attemptsCount) + 2);

  return {
    id: evmPot.id.toString(),
    creator: evmPot.creator,
    total_usdc: evmPot.totalAmount.toString(),
    entry_fee: evmPot.fee.toString(),
    created_at: evmPot.createdAt.toString(),
    expires_at: expiresAt,
    is_active: evmPot.isActive,
    attempts_count: evmPot.attemptsCount.toString(),
    one_fa_address: evmPot.oneFaAddress,
    one_fa_private_key: evmPot.oneFaPrivateKey,
    // UI-specific, transformed fields
    title: `Pot #${evmPot.id}`,
    totalValue,
    entryFee,
    potentialReward,
    timeLeft,
    isExpired,
    difficulty,
    // EVM-specific fields
    network: 'evm',
    chainId: '102031',
  };
};

export const useEVMPotStore = create<EVMPotState>((set, get) => ({
  pots: {},
  sortedPots: [],
  currentPot: null,
  attempts: [],
  loading: false,
  error: null,
  hasMorePots: true,
  currentBatch: 0,
  totalPots: 0,

  fetchPots: async (forceRefresh = false) => {
    const state = get();
    if (state.loading) return;

    set({ loading: true, error: null });

    try {
      // Load metadata
      const metadataStr = localStorage.getItem(EVM_POTS_METADATA_KEY);
      let metadata: EVMPotMetadata = {
        lastFetch: 0,
        totalPots: 0,
        fetchedPots: 0,
        allPotIds: [],
      };

      if (metadataStr && !forceRefresh) {
        metadata = JSON.parse(metadataStr);
      }

      // Check if we need to refresh (every 30 seconds)
      const now = Date.now();
      const shouldRefresh = forceRefresh || (now - metadata.lastFetch > 30000);

      if (shouldRefresh) {
        // Fetch active pots from EVM contract
        const activePots = await evmContractService.getActivePots();
        
        // Transform to UI format
        const transformedPots = activePots.map(transformEVMPotToPot);
        
        // Update metadata
        metadata = {
          lastFetch: now,
          totalPots: transformedPots.length,
          fetchedPots: transformedPots.length,
          allPotIds: transformedPots.map(pot => pot.id),
        };

        // Store pots
        const potsMap: Record<string, Pot> = {};
        transformedPots.forEach(pot => {
          potsMap[pot.id] = pot;
        });

        // Sort pots by creation date (newest first)
        const sortedPots = transformedPots.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        set({
          pots: potsMap,
          sortedPots,
          totalPots: transformedPots.length,
          hasMorePots: false, // EVM contract returns all active pots
          currentBatch: 1,
        });

        // Save to localStorage
        localStorage.setItem(EVM_POTS_METADATA_KEY, JSON.stringify(metadata));
        localStorage.setItem(EVM_POTS_STORAGE_KEY, JSON.stringify(potsMap));
      } else {
        // Load from localStorage
        const potsStr = localStorage.getItem(EVM_POTS_STORAGE_KEY);
        if (potsStr) {
          const potsMap = JSON.parse(potsStr);
          const sortedPots = Object.values(potsMap).sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          set({
            pots: potsMap,
            sortedPots,
            totalPots: metadata.totalPots,
            hasMorePots: false,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch EVM pots:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch pots' });
    } finally {
      set({ loading: false });
    }
  },

  fetchNextBatch: async () => {
    // EVM contract returns all active pots, so no pagination needed
    const state = get();
    if (!state.hasMorePots) return;
    
    await state.fetchPots(true);
  },

  fetchPotById: async (id: string) => {
    const state = get();
    if (state.loading) return;

    set({ loading: true, error: null });

    try {
      const evmPot = await evmContractService.getPot(id);
      if (evmPot) {
        const pot = transformEVMPotToPot(evmPot);
        
        set(state => ({
          pots: { ...state.pots, [pot.id]: pot },
          currentPot: pot,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch EVM pot:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch pot' });
    } finally {
      set({ loading: false });
    }
  },

  getPotById: (id: string) => {
    const state = get();
    return state.pots[id];
  },

  addAttempt: (attempt: Attempt) => {
    set(state => ({
      attempts: [...state.attempts, attempt],
    }));
    
    // Save to localStorage
    const attemptsStr = localStorage.getItem(EVM_ATTEMPTS_STORAGE_KEY);
    const attempts = attemptsStr ? JSON.parse(attemptsStr) : [];
    attempts.push(attempt);
    localStorage.setItem(EVM_ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  },

  addPot: (pot: Pot) => {
    set(state => ({
      pots: { ...state.pots, [pot.id]: pot },
      sortedPots: [pot, ...state.sortedPots].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      totalPots: state.totalPots + 1,
    }));
  },

  clearCache: () => {
    localStorage.removeItem(EVM_POTS_STORAGE_KEY);
    localStorage.removeItem(EVM_POTS_METADATA_KEY);
    localStorage.removeItem(EVM_ATTEMPTS_STORAGE_KEY);
    
    set({
      pots: {},
      sortedPots: [],
      currentPot: null,
      attempts: [],
      hasMorePots: true,
      currentBatch: 0,
      totalPots: 0,
    });
  },

  expirePot: async (potId: string) => {
    try {
      await evmContractService.expirePot(potId);
      
      // Update local state
      set(state => {
        const pot = state.pots[potId];
        if (pot) {
          const updatedPot = { ...pot, is_active: false, isExpired: true };
          return {
            pots: { ...state.pots, [potId]: updatedPot },
            sortedPots: state.sortedPots.map(p => p.id === potId ? updatedPot : p),
          };
        }
        return state;
      });
      
      return true;
    } catch (error) {
      console.error('Failed to expire EVM pot:', error);
      return false;
    }
  },

  expireAllPots: async (potIds: string[]) => {
    let success = 0;
    let failed = 0;

    for (const potId of potIds) {
      const result = await get().expirePot(potId);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  },
}));

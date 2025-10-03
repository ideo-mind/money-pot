import { create } from 'zustand';
import { Pot, Attempt } from '@/types';
import { aptos, MODULE_ADDRESS, MODULE_NAME } from '@/lib/aptos';
import { formatDistanceToNowStrict } from 'date-fns';
import { AptosApiError } from '@aptos-labs/ts-sdk';
// Removed import of initialMockPots - starting with empty array
import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from '@/abis';
const ATTEMPTS_STORAGE_KEY = 'money-pot-attempts';
interface PotState {
  pots: Pot[];
  currentPot: Pot | null;
  attempts: Attempt[];
  loading: boolean;
  error: string | null;
  fetchPots: () => Promise<void>;
  fetchPotById: (id: string) => Promise<void>;
  getPotById: (id: string) => Pot | undefined;
  addAttempt: (attempt: Attempt) => void;
  addPot: (pot: Pot) => void;
}
// Removed POT_TITLES array - using Pot #ID format instead
export const transformToPot = (onChainPot: any): Pot => {
  const totalValue = Number(onChainPot.total_amount) / 1_000_000; // Assuming 6 decimals for USDC
  const entryFee = Number(onChainPot.fee) / 1_000_000;
  const potentialReward = totalValue * 0.4;
  const expiresAt = new Date(Number(onChainPot.expires_at) * 1000);
  const isExpired = expiresAt < new Date();
  const timeLeft = isExpired
    ? `Expired ${formatDistanceToNowStrict(expiresAt, { addSuffix: true })}`
    : formatDistanceToNowStrict(expiresAt, { addSuffix: true });
  const difficulty = Math.min(Number(onChainPot.attempts_count) % 11 + 2, Number(onChainPot.attempts_count) + 2);
  return {
    ...onChainPot,
    id: onChainPot.id.toString(),
    title: `Pot #${onChainPot.id}`,
    totalValue,
    entryFee,
    potentialReward,
    timeLeft,
    isExpired,
    creatorAvatar: `https://api.dicebear.com/8.x/pixel-art/svg?seed=${onChainPot.creator}`,
    creatorUsername: `${onChainPot.creator.slice(0, 6)}...${onChainPot.creator.slice(-4)}`,
    difficulty,
  };
};
const loadAttemptsFromStorage = (): Attempt[] => {
  try {
    const storedAttempts = localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    return storedAttempts ? JSON.parse(storedAttempts) : [];
  } catch (error) {
    console.error("Failed to load attempts from local storage:", error);
    return [];
  }
};
export const usePotStore = create<PotState>((set, get) => ({
  pots: [], // Start with empty array - no mock pots
  currentPot: null,
  attempts: loadAttemptsFromStorage(),
  loading: false,
  error: null,
  fetchPots: async () => {
    set({ loading: true, error: null });
    try {
      // Use the generated ABI functions
      const [potIds] = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getPots(aptos);
      
      if (potIds.length === 0) {
        set({ pots: [], loading: false }); // No pots found, show empty state
        return;
      }
      
      // Limit to first 20 pots to avoid rate limiting
      const limitedPotIds = potIds.slice(0, 20);
      console.log(`Fetching ${limitedPotIds.length} pots (limited from ${potIds.length} total)`);
      
      // Fetch pots with delay between requests to avoid rate limiting
      const transformedPots = [];
      for (let i = 0; i < limitedPotIds.length; i++) {
        try {
          const [pot] = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getPot(aptos, {
            functionArguments: [limitedPotIds[i]]
          });
          transformedPots.push(transformToPot(pot));
          
          // Add small delay between requests to avoid rate limiting
          if (i < limitedPotIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (potError) {
          console.warn(`Failed to fetch pot ${limitedPotIds[i]}:`, potError);
          // Continue with other pots even if one fails
        }
      }
      
      set({ pots: transformedPots, loading: false });
    } catch (error) {
      console.error("Failed to fetch pots:", error);
      let errorMessage = "Failed to fetch pots from the blockchain.";
      
      // Check for specific error types
      if (error instanceof AptosApiError) {
        if (error.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again in a moment.";
        } else if (error.status >= 500) {
          errorMessage = "Blockchain service temporarily unavailable. Please try again later.";
        }
      }
      
      set({ 
        error: errorMessage, 
        loading: false,
        pots: [] // Clear pots on error
      });
    }
  },
  fetchPotById: async (id: string) => {
    // First, check if the pot is in the local state
    const localPot = get().pots.find(p => p.id === id);
    if (localPot) {
      set({ currentPot: localPot, loading: false, error: null });
      return;
    }
    set({ loading: true, error: null, currentPot: null });
    try {
      // Use the generated ABI functions
      const [onChainPot] = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getPot(aptos, {
        functionArguments: [BigInt(id)]
      });
      
      const transformedPot = transformToPot(onChainPot);
      set({ currentPot: transformedPot, loading: false });
    } catch (error) {
      if (error instanceof AptosApiError && error.status === 404) {
        set({ error: `Pot #${id} could not be found.`, loading: false });
      } else {
        console.error(`Failed to fetch pot ${id}:`, error);
        set({ error: `Failed to fetch pot #${id} from the blockchain.`, loading: false });
      }
    }
  },
  getPotById: (id: string) => {
    return get().pots.find((pot) => pot.id === id);
  },
  addAttempt: (attempt: Attempt) => {
    set((state) => {
      const newAttempts = [attempt, ...state.attempts];
      try {
        localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(newAttempts));
      } catch (error) {
        console.error("Failed to save attempts to local storage:", error);
      }
      return { attempts: newAttempts };
    });
  },
  addPot: (pot: Pot) => {
    // TODO: In a real-world scenario with a backend, we would re-fetch the list
    // or receive a pushed update. For this frontend-driven approach,
    // prepending the new pot provides instant and optimistic UI feedback.
    set((state) => ({ pots: [pot, ...state.pots] }));
  },
}));
import { create } from 'zustand';
import { Pot, Attempt } from '@/types';
import { aptos, MODULE_ADDRESS, MODULE_NAME } from '@/lib/aptos';
import { formatDistanceToNowStrict } from 'date-fns';
import { AptosApiError } from '@aptos-labs/ts-sdk';
// Removed import of initialMockPots - starting with empty array
import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from '@/abis';
const ATTEMPTS_STORAGE_KEY = 'money-pot-attempts';
const POTS_STORAGE_KEY = 'money-pot-pots';
const POTS_METADATA_KEY = 'money-pot-metadata';

interface PotMetadata {
  lastFetch: number;
  totalPots: number;
  fetchedPots: number;
  allPotIds: string[];
}

interface PotState {
  pots: Pot[];
  currentPot: Pot | null;
  attempts: Attempt[];
  loading: boolean;
  error: string | null;
  hasMorePots: boolean;
  currentBatch: number;
  totalPots: number;
  fetchPots: () => Promise<void>;
  fetchNextBatch: () => Promise<void>;
  fetchPotById: (id: string) => Promise<void>;
  getPotById: (id: string) => Pot | undefined;
  addAttempt: (attempt: Attempt) => void;
  addPot: (pot: Pot) => void;
  clearCache: () => void;
}
// Removed POT_TITLES array - using Pot #ID format instead
export const transformToPot = (onChainPot: any): Pot => {
  const totalValue = Number(onChainPot.total_amount) / 1_000_000; // Assuming 6 decimals for USDC
  const entryFee = Number(onChainPot.fee) / 1_000_000;
  const potentialReward = totalValue * 0.4;
  
  // Handle different possible formats for expires_at
  let expiresAt: Date;
  try {
    if (typeof onChainPot.expires_at === 'string') {
      // If it's already a string, try to parse it directly
      expiresAt = new Date(onChainPot.expires_at);
    } else if (typeof onChainPot.expires_at === 'number') {
      // If it's a number, assume it's Unix timestamp in seconds
      expiresAt = new Date(onChainPot.expires_at * 1000);
    } else if (onChainPot.expires_at && typeof onChainPot.expires_at.toString === 'function') {
      // If it's a BigInt or other object, convert to string first
      const timestamp = parseInt(onChainPot.expires_at.toString());
      expiresAt = new Date(timestamp * 1000);
    } else {
      // Fallback: assume it's already a valid timestamp
      expiresAt = new Date(onChainPot.expires_at);
    }
    
    // Validate the date
    if (isNaN(expiresAt.getTime())) {
      console.warn('Invalid expiration date for pot:', onChainPot.id, 'expires_at:', onChainPot.expires_at);
      // Set a default expiration time (24 hours from now)
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  } catch (error) {
    console.error('Error parsing expiration date:', error);
    // Set a default expiration time (24 hours from now)
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
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

const loadPotsFromStorage = (): Pot[] => {
  try {
    const storedPots = localStorage.getItem(POTS_STORAGE_KEY);
    return storedPots ? JSON.parse(storedPots) : [];
  } catch (error) {
    console.error("Failed to load pots from local storage:", error);
    return [];
  }
};

const loadMetadataFromStorage = (): PotMetadata | null => {
  try {
    const storedMetadata = localStorage.getItem(POTS_METADATA_KEY);
    return storedMetadata ? JSON.parse(storedMetadata) : null;
  } catch (error) {
    console.error("Failed to load metadata from local storage:", error);
    return null;
  }
};

const savePotsToStorage = (pots: Pot[]) => {
  try {
    localStorage.setItem(POTS_STORAGE_KEY, JSON.stringify(pots));
  } catch (error) {
    console.error("Failed to save pots to local storage:", error);
  }
};

const saveMetadataToStorage = (metadata: PotMetadata) => {
  try {
    localStorage.setItem(POTS_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error("Failed to save metadata to local storage:", error);
  }
};
export const usePotStore = create<PotState>((set, get) => ({
  pots: loadPotsFromStorage(), // Load cached pots
  currentPot: null,
  attempts: loadAttemptsFromStorage(),
  loading: false,
  error: null,
  hasMorePots: true,
  currentBatch: 0,
  totalPots: 0,
  fetchPots: async () => {
    const state = get();
    const metadata = loadMetadataFromStorage();
    const now = Date.now();
    
    // Check if we have cached data and it's recent (less than 5 minutes old)
    if (metadata && state.pots.length > 0 && (now - metadata.lastFetch) < 5 * 60 * 1000) {
      console.log("Using cached pots data");
      set({ 
        totalPots: metadata.totalPots,
        hasMorePots: metadata.fetchedPots < metadata.totalPots,
        currentBatch: Math.floor(metadata.fetchedPots / 10)
      });
      return;
    }
    
    set({ loading: true, error: null });
    try {
      // Get all pot IDs first
      const [potIds] = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getPots(aptos);
      
      if (potIds.length === 0) {
        set({ pots: [], loading: false, totalPots: 0, hasMorePots: false });
        savePotsToStorage([]);
        saveMetadataToStorage({
          lastFetch: now,
          totalPots: 0,
          fetchedPots: 0,
          allPotIds: []
        });
        return;
      }
      
      // Save metadata with all pot IDs
      const newMetadata: PotMetadata = {
        lastFetch: now,
        totalPots: potIds.length,
        fetchedPots: 0,
        allPotIds: potIds.map(id => id.toString())
      };
      saveMetadataToStorage(newMetadata);
      
      set({ 
        totalPots: potIds.length,
        hasMorePots: potIds.length > 0,
        currentBatch: 0,
        loading: false
      });
      
      // Start fetching first batch
      await get().fetchNextBatch();
      
    } catch (error) {
      console.error("Failed to fetch pot IDs:", error);
      let errorMessage = "Failed to fetch pots from the blockchain.";
      
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
        pots: state.pots // Keep existing cached pots on error
      });
    }
  },
  fetchNextBatch: async () => {
    const state = get();
    const metadata = loadMetadataFromStorage();
    
    if (!metadata || !state.hasMorePots) {
      return;
    }
    
    const batchSize = 10;
    const startIndex = state.currentBatch * batchSize;
    const endIndex = Math.min(startIndex + batchSize, metadata.allPotIds.length);
    const potIdsToFetch = metadata.allPotIds.slice(startIndex, endIndex);
    
    if (potIdsToFetch.length === 0) {
      set({ hasMorePots: false });
      return;
    }
    
    console.log(`Fetching batch ${state.currentBatch + 1}: pots ${startIndex + 1}-${endIndex} of ${metadata.totalPots}`);
    
    const newPots: Pot[] = [];
    
    // Fetch pots one by one with delays
    for (let i = 0; i < potIdsToFetch.length; i++) {
      try {
        const [pot] = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getPot(aptos, {
          functionArguments: [BigInt(potIdsToFetch[i])]
        });
        newPots.push(transformToPot(pot));
        
        // Add delay between requests
        if (i < potIdsToFetch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (potError) {
        console.warn(`Failed to fetch pot ${potIdsToFetch[i]}:`, potError);
      }
    }
    
    // Update state with new pots
    const updatedPots = [...state.pots, ...newPots];
    const newFetchedCount = metadata.fetchedPots + newPots.length;
    const hasMore = newFetchedCount < metadata.totalPots;
    
    set({
      pots: updatedPots,
      currentBatch: state.currentBatch + 1,
      hasMorePots: hasMore
    });
    
    // Update metadata
    const updatedMetadata: PotMetadata = {
      ...metadata,
      fetchedPots: newFetchedCount
    };
    saveMetadataToStorage(updatedMetadata);
    savePotsToStorage(updatedPots);
    
    // Schedule next batch if there are more pots
    if (hasMore) {
      console.log(`Scheduling next batch in 100 seconds...`);
      setTimeout(() => {
        get().fetchNextBatch();
      }, 100000); // 100 seconds
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
    // Add pot to state and cache
    set((state) => {
      const newPots = [pot, ...state.pots];
      savePotsToStorage(newPots);
      return { pots: newPots };
    });
  },
  clearCache: () => {
    localStorage.removeItem(POTS_STORAGE_KEY);
    localStorage.removeItem(POTS_METADATA_KEY);
    set({ 
      pots: [], 
      hasMorePots: true, 
      currentBatch: 0, 
      totalPots: 0 
    });
  },
}));
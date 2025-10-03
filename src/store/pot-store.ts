import { create } from 'zustand';
import { Pot, Attempt } from '@/types';
import { aptos, MODULE_ADDRESS, MODULE_NAME } from '@/lib/aptos';
import { formatDistanceToNowStrict } from 'date-fns';
import { AptosApiError } from '@aptos-labs/ts-sdk';
import { initialMockPots } from '@/lib/mock-data';
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
const POT_TITLES = [
  "The Serpent's Riddle", "Galleon's Gold", "The Quick Brown Fox",
  "Emerald Enigma", "The Alchemist's Secret", "Beginner's Luck",
  "The Oracle's Test", "Titan's Treasure", "The Ruby Cipher"
];
export const transformToPot = (onChainPot: any): Pot => {
  const totalValue = parseInt(onChainPot.total_usdc) / 1_000_000; // Assuming 6 decimals for USDC
  const entryFee = parseInt(onChainPot.entry_fee) / 1_000_000;
  const potentialReward = totalValue * 0.4;
  const expiresAt = new Date(parseInt(onChainPot.expires_at) * 1000);
  const isExpired = expiresAt < new Date();
  const timeLeft = isExpired
    ? `Expired ${formatDistanceToNowStrict(expiresAt, { addSuffix: true })}`
    : formatDistanceToNowStrict(expiresAt, { addSuffix: true });
  const difficulty = Math.min(Number(onChainPot.attempts_count) % 11 + 2, Number(onChainPot.attempts_count) + 2);
  return {
    ...onChainPot,
    title: POT_TITLES[parseInt(onChainPot.id) % POT_TITLES.length],
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
  pots: initialMockPots,
  currentPot: null,
  attempts: loadAttemptsFromStorage(),
  loading: false,
  error: null,
  fetchPots: async () => {
    set({ loading: true, error: null });
    try {
      // TODO: Direct Aptos integration
      const potsResource = await aptos.getAccountResource({
        accountAddress: MODULE_ADDRESS,
        resourceType: `${MODULE_ADDRESS}::${MODULE_NAME}::Pots`,
      });
      const potsTableHandle = (potsResource.data as any).pots.handle;
      const potIds = (potsResource.data as any).pot_ids;
      const potPromises = potIds.map((id: string) =>
        // TODO: Direct Aptos integration
        aptos.getTableItem({
          handle: potsTableHandle,
          data: {
            key: id,
            key_type: "u64",
            value_type: `${MODULE_ADDRESS}::${MODULE_NAME}::MoneyPot`,
          },
        })
      );
      const onChainPots = await Promise.all(potPromises);
      const transformedPots = onChainPots.map(transformToPot);
      // FIX: Only overwrite initial mock data if the blockchain returns actual pots.
      if (transformedPots.length > 0) {
        set({ pots: transformedPots, loading: false });
      } else {
        set({ loading: false }); // Stop loading but keep mock data
      }
    } catch (error) {
      // FIX: On 404 (or other errors), stop loading but do not clear mock data.
      if (error instanceof AptosApiError && error.status === 404) {
        console.log("No pots found on-chain, displaying mock data.");
        set({ loading: false });
      } else {
        console.error("Failed to fetch pots:", error);
        set({ error: "Failed to fetch pots from the blockchain.", loading: false });
      }
    }
  },
  fetchPotById: async (id: string) => {
    // First, check if the pot is in the local state (including mock pots)
    const localPot = get().pots.find(p => p.id === id);
    if (localPot) {
      set({ currentPot: localPot, loading: false, error: null });
      return;
    }
    set({ loading: true, error: null, currentPot: null });
    try {
      // TODO: Direct Aptos integration
      const potsResource = await aptos.getAccountResource({
        accountAddress: MODULE_ADDRESS,
        resourceType: `${MODULE_ADDRESS}::${MODULE_NAME}::Pots`,
      });
      const potsTableHandle = (potsResource.data as any).pots.handle;
      // TODO: Direct Aptos integration
      const onChainPot = await aptos.getTableItem({
        handle: potsTableHandle,
        data: {
          key: id,
          key_type: "u64",
          value_type: `${MODULE_ADDRESS}::${MODULE_NAME}::MoneyPot`,
        },
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
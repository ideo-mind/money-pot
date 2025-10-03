/**
 * Utility for storing and retrieving 1FA address -> private key mappings
 */

const ONE_FA_STORAGE_KEY = 'money-pot-1fa-keys';

interface OneFaKeyMapping {
  [address: string]: string; // address -> private key
}

/**
 * Store a 1FA address and its corresponding private key
 */
export const storeOneFaKey = (address: string, privateKey: string): void => {
  try {
    const existingData = getOneFaKeys();
    existingData[address.toLowerCase()] = privateKey;
    localStorage.setItem(ONE_FA_STORAGE_KEY, JSON.stringify(existingData));
    console.log(`Stored 1FA key for address: ${address}`);
  } catch (error) {
    console.error('Failed to store 1FA key:', error);
  }
};

/**
 * Retrieve a 1FA private key by address
 */
export const getOneFaKey = (address: string): string | null => {
  try {
    const data = getOneFaKeys();
    return data[address.toLowerCase()] || null;
  } catch (error) {
    console.error('Failed to retrieve 1FA key:', error);
    return null;
  }
};

/**
 * Get all stored 1FA key mappings
 */
export const getOneFaKeys = (): OneFaKeyMapping => {
  try {
    const stored = localStorage.getItem(ONE_FA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load 1FA keys:', error);
    return {};
  }
};

/**
 * Remove a 1FA key mapping
 */
export const removeOneFaKey = (address: string): void => {
  try {
    const data = getOneFaKeys();
    delete data[address.toLowerCase()];
    localStorage.setItem(ONE_FA_STORAGE_KEY, JSON.stringify(data));
    console.log(`Removed 1FA key for address: ${address}`);
  } catch (error) {
    console.error('Failed to remove 1FA key:', error);
  }
};

/**
 * Clear all 1FA key mappings
 */
export const clearOneFaKeys = (): void => {
  try {
    localStorage.removeItem(ONE_FA_STORAGE_KEY);
    console.log('Cleared all 1FA keys');
  } catch (error) {
    console.error('Failed to clear 1FA keys:', error);
  }
};

/**
 * Get all stored addresses
 */
export const getStoredAddresses = (): string[] => {
  try {
    const data = getOneFaKeys();
    return Object.keys(data);
  } catch (error) {
    console.error('Failed to get stored addresses:', error);
    return [];
  }
};

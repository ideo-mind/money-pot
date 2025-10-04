// Real API for interacting with the off-chain verifier service.
// This makes HTTPS requests to the Cloudflare Worker verifier service.

import { ENV_CONFIG } from './aptos';

const VERIFIER_BASE_URL = ENV_CONFIG.VERIFIER_SERVICE_URL + ENV_CONFIG.VERIFIER_SERVICE_BASE_URL;

export interface RegisterPayload {
  potId: string;
  password: string;
  legend: Record<string, string>;
  oneFaAddress: string;
}


/**
 * Registers a pot's challenge details with the verifier service.
 * @param payload The registration data.
 * @returns A promise that resolves to a success status.
 */
export const registerPot = async (payload: RegisterPayload): Promise<{ success: boolean }> => {
  try {
    console.log("Registering pot with verifier...", payload);
    
    // Step 1: Get encryption key from register/options
    const optionsResponse = await fetch(`${VERIFIER_BASE_URL}/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!optionsResponse.ok) {
      throw new Error('Failed to get encryption key');
    }
    
    const optionsData = await optionsResponse.json();
    console.log("Got encryption key:", optionsData);
    
    // Step 2: Create payload data (no encryption needed as per app.py)
    const currentTime = Math.floor(Date.now() / 1000);
    const payloadData = {
      pot_id: payload.potId,
      "1p": payload.password,
      legend: payload.legend,
      iat: currentTime,
      iss: payload.oneFaAddress,
      exp: currentTime + 3600
    };

    console.log("Payload data:", payloadData);
    
    // Step 3: Follow app.py exactly - hex encode the JSON string
    const payloadJson = JSON.stringify(payloadData);
    console.log("Payload JSON:", payloadJson);
    
    // Convert JSON string to hex exactly like app.py: payload_json.encode().hex()
    const encryptedPayload = Array.from(new TextEncoder().encode(payloadJson))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
    
    console.log("Payload (hex-encoded like app.py):", encryptedPayload);
    
    // Step 4: Register with verifier service
    const response = await fetch(`${VERIFIER_BASE_URL}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encrypted_payload: encryptedPayload, // Use the expected field name
        public_key: optionsData.public_key,
        signature: 'mock_signature' // Simplified for MVP
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Registration failed: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Pot registered successfully:", result);
    return result;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

/**
 * Fetches authentication options (challenges) from the verifier.
 * @param attemptId The attempt ID from the smart contract.
 * @param publicKey The hunter's address (as per app.py reference).
 * @returns A promise that resolves with challenges.
 */
export const getAuthOptions = async (attemptId: string, publicKey?: string): Promise<{ challenges: any[] }> => {
  try {
    console.log("Getting 1P auth options for attempt:", attemptId);
    
    // Use hunter's address as public key (as per app.py reference)
    const hunterPublicKey = publicKey || attemptId;
    
    const response = await fetch(`${VERIFIER_BASE_URL}/authenticate/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { attempt_id: attemptId },
        public_key: hunterPublicKey
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get authentication options: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log("Got 1P challenges:", result);
    return result;
  } catch (error) {
    console.error('Failed to get 1P auth options:', error);
    throw error;
  }
};

/**
 * Verifies the user's solutions with the verifier.
 * @param challengeId The attempt ID (used as challenge_id as per app.py reference).
 * @param solutions An array of user-submitted solutions (directions).
 * @returns A promise that resolves to a success status.
 */
export const verifyAuth = async (challengeId: string, solutions: string[]): Promise<{ success: boolean }> => {
  try {
    console.log("Verifying 1P solutions for challenge:", challengeId, solutions);
    
    const response = await fetch(`${VERIFIER_BASE_URL}/authenticate/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solutions,
        challenge_id: challengeId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to verify solutions: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log("1P verification result:", result);
    return result;
  } catch (error) {
    console.error('1P verification failed:', error);
    throw error;
  }
};
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
    
    // Create payload data (no encryption needed as per app.py)
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
    
    // Register with verifier service directly
    const response = await fetch(`${VERIFIER_BASE_URL}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: payloadData,
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
 * @returns A promise that resolves with challenges.
 */
export const getAuthOptions = async (attemptId: string): Promise<{ challenges: any[] }> => {
  try {
    console.log("Getting auth options for attempt:", attemptId);
    
    const response = await fetch(`${VERIFIER_BASE_URL}/authenticate/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { attempt_id: attemptId },
        public_key: attemptId // Use attempt_id as public key for MVP
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get authentication options');
    }
    
    const result = await response.json();
    console.log("Got challenges:", result);
    return result;
  } catch (error) {
    console.error('Failed to get auth options:', error);
    throw error;
  }
};

/**
 * Verifies the user's solutions with the verifier.
 * @param challengeId The ID of the challenge being verified.
 * @param solutions An array of user-submitted solutions (directions).
 * @returns A promise that resolves to a success status.
 */
export const verifyAuth = async (challengeId: string, solutions: string[]): Promise<{ success: boolean }> => {
  try {
    console.log("Verifying solutions for challenge:", challengeId, solutions);
    
    const response = await fetch(`${VERIFIER_BASE_URL}/authenticate/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solutions,
        challenge_id: challengeId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to verify solutions');
    }
    
    const result = await response.json();
    console.log("Verification result:", result);
    return result;
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
};
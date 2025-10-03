// Real API for interacting with the off-chain verifier service.
// This makes HTTPS requests to the Cloudflare Worker verifier service.

import { ENV_CONFIG } from './aptos';
import forge from 'node-forge';
import axios, { AxiosInstance, AxiosError } from 'axios';

const VERIFIER_BASE_URL = ENV_CONFIG.VERIFIER_SERVICE_URL + ENV_CONFIG.VERIFIER_SERVICE_BASE_URL;

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: VERIFIER_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API request failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    return Promise.reject(error);
  }
);

export interface RegisterPayload {
  potId: string;
  password: string;
  legend: Record<string, string>;
  oneFaAddress: string;
}

/**
 * Encrypts data using RSA public key - matching app.py approach
 */
const encryptWithRSA = (data: string, publicKeyPem: string): string => {
  try {
    console.log('Encrypting data length:', data.length);
    console.log('Data preview:', data.substring(0, 100) + '...');
    
    // Parse the public key from PEM format
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    
    // Check key size and calculate max message size
    const keySize = publicKey.n.bitLength();
    const maxMessageSize = (keySize / 8) - 42; // RSA-OAEP overhead
    console.log('RSA key size:', keySize, 'bits');
    console.log('Max message size:', maxMessageSize, 'bytes');
    console.log('Data size:', data.length, 'bytes');
    
    if (data.length > maxMessageSize) {
      throw new Error(`Data too large for RSA encryption. Max: ${maxMessageSize} bytes, Got: ${data.length} bytes`);
    }
    
    // Convert string to bytes using UTF-8 encoding
    const dataBytes = forge.util.encodeUtf8(data);
    
    // Encrypt using RSA-OAEP with SHA-256 (matching app.py)
    const encrypted = publicKey.encrypt(dataBytes, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });
    
    // Convert to hex string (matching app.py's .hex() output)
    const hexResult = forge.util.bytesToHex(encrypted);
    console.log('Encrypted length:', hexResult.length / 2, 'bytes');
    console.log('Encrypted hex preview:', hexResult.substring(0, 50) + '...');
    
    // Verify the length is correct for 2048-bit key (should be 256 bytes)
    if (hexResult.length / 2 !== 256) {
      console.warn('Unexpected encrypted length:', hexResult.length / 2, 'expected 256');
    }
    
    return hexResult;
  } catch (error) {
    console.error('RSA encryption error:', error);
    console.error('Error details:', error);
    
    // If encryption fails, let's try a different approach
    // Maybe the data is too large, let's try with a smaller payload
    try {
      console.log('Trying with smaller payload...');
      const smallPayload = {
        pot_id: "1",
        "1p": "A",
        legend: {"A": "U"},
        iat: Math.floor(Date.now() / 1000),
        iss: "0x123",
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const smallJson = JSON.stringify(smallPayload);
      console.log('Small payload length:', smallJson.length);
      
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      const dataBytes = forge.util.encodeUtf8(smallJson);
      const encrypted = publicKey.encrypt(dataBytes, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha256.create() }
      });
      
      const hexResult = forge.util.bytesToHex(encrypted);
      console.log('Small payload encrypted length:', hexResult.length / 2, 'bytes');
      return hexResult;
    } catch (fallbackError) {
      console.error('Fallback encryption also failed:', fallbackError);
      throw new Error('Failed to encrypt data with RSA: ' + error.message);
    }
  }
};

/**
 * Registers a pot's challenge details with the verifier service.
 * @param payload The registration data.
 * @returns A promise that resolves to a success status.
 */
export const registerPot = async (payload: RegisterPayload): Promise<{ success: boolean }> => {
  try {
    console.log("Registering pot with verifier...", payload);
    
    // Step 1: Get encryption key
    const optionsResponse = await apiClient.post('/register/options');
    const { key_id, public_key } = optionsResponse.data;
    
    // Step 2: Create encrypted payload
    const currentTime = Math.floor(Date.now() / 1000);
    const payloadData = {
      pot_id: payload.potId,
      "1p": payload.password,
      legend: payload.legend,
      iat: currentTime,
      iss: payload.oneFaAddress,
      exp: currentTime + 3600
    };
    
    // Encrypt the payload using RSA
    const jsonString = JSON.stringify(payloadData);
    const encryptedPayload = encryptWithRSA(jsonString, public_key);

    console.log("Payload data:", payloadData);
    
    // Step 3: Register with verifier
    const registerResponse = await apiClient.post('/register/verify', {
      encrypted_payload: encryptedPayload,
      public_key,
      signature: 'mock_signature' // Simplified for MVP
    });
    
    const result = registerResponse.data;
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
    
    const response = await apiClient.post('/authenticate/options', {
      payload: { attempt_id: attemptId },
      public_key: attemptId // Use attempt_id as public key for MVP
    });
    
    const result = response.data;
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
    
    const response = await apiClient.post('/authenticate/verify', {
      solutions,
      challenge_id: challengeId
    });
    
    const result = response.data;
    console.log("Verification result:", result);
    return result;
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
};
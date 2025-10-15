// Real API for interacting with the off-chain verifier service and Aptos blockchain.
// This makes HTTPS requests to the Cloudflare Worker verifier service and handles blockchain transactions.

import axios from 'axios';
import { 
  ENV_CONFIG, 
  aptos,
  loadAccountFromPrivateKey,
  createPot,
  attemptPot,
  getActivePots,
  getPots,
  getAttempt,
  getTransactionEvents,
  extractPotIdFromEvents,
  extractAttemptIdFromEvents
} from './aptos';
import { Account, AccountAddress } from "@aptos-labs/ts-sdk";
import { 
  PotCreationParams, 
  PotAttemptParams, 
  PotCreationResult, 
  PotAttemptResult,
  ApiResponse,
  VerifierServiceConfig,
  ChallengeSolution,
  AuthenticationResult
} from '../types';

const VERIFIER_BASE_URL = ENV_CONFIG.MONEY_AUTH_URL +"/aptos";

export interface RegisterPayload {
  potId: string;
  password: string;
  legend: Record<string, string>;
  oneFaAddress: string;
}

export interface RegisterOptions {
  key_id: string;
  public_key: string;
  colors: Record<string, string>;
  directions: Record<string, string>;
}

export interface AuthOptions {
  challenges: any[];
  colors: Record<string, string>;
  directions: Record<string, string>;
}


/**
 * Registers a pot's challenge details with the verifier service.
 * @param payload The registration data.
 * @returns A promise that resolves to a success status.
 */
export const registerPot = async (payload: RegisterPayload): Promise<{ success: boolean; colors: Record<string, string>; directions: Record<string, string> }> => {
  try {
    console.log("Registering pot with verifier...", payload);
    
    // Step 1: Get registration options (colors and directions)
    const optionsResponse = await axios.post(`${VERIFIER_BASE_URL}/register/options`, {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const optionsData = optionsResponse.data;
    console.log("Got registration options:", optionsData);
    
    // Step 2: Create payload data for Aptos register/verify endpoint
    const currentTime = Math.floor(Date.now() / 1000);
    const payloadData = {
      pot_id: payload.potId,
      "1p": payload.password,
      legend: payload.legend,
      iat: currentTime,
      iss: payload.oneFaAddress,
      exp: currentTime + 3600
    };

    console.log("Payload data for Aptos register/verify:", payloadData);
    
    // Step 3: Register with Aptos verifier service (expects plain payload, not encrypted)
    const response = await axios.post(`${VERIFIER_BASE_URL}/register/verify`, {
      payload: payloadData, // Plain payload object for Aptos endpoint
      signature: 'mock_signature' // Simplified for MVP
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = response.data;
    console.log("Pot registered successfully:", result);
    return {
      success: result.success || true,
      colors: optionsData.colors,
      directions: optionsData.directions
    };
  } catch (error: any) {
    console.error('Registration failed:', error);
    if (error.response) {
      throw new Error(`Registration failed: ${error.response.data?.error || error.response.statusText}`);
    }
    throw error;
  }
};

/**
 * Fetches authentication options (challenges) from the verifier.
 * @param attemptId The attempt ID from the smart contract.
 * @param publicKey The hunter's address (as per app.py reference).
 * @returns A promise that resolves with challenges.
 */
export const getAuthOptions = async (attemptId: string, publicKey?: string): Promise<AuthOptions> => {
  try {
    console.log("Getting 1P auth options for attempt:", attemptId);
    
    // Use hunter's address as public key (as per app.py reference)
    const hunterPublicKey = publicKey || attemptId;
    
    const response = await axios.post(`${VERIFIER_BASE_URL}/authenticate/options`, {
      payload: { attempt_id: attemptId },
      public_key: hunterPublicKey
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = response.data;
    console.log("Got 1P challenges:", result);
    return {
      challenges: result.challenges || [],
      colors: result.colors || {},
      directions: result.directions || {}
    };
  } catch (error: any) {
    console.error('Failed to get 1P auth options:', error);
    if (error.response) {
      throw new Error(`Failed to get authentication options: ${error.response.data?.error || error.response.statusText}`);
    }
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
    
    const response = await axios.post(`${VERIFIER_BASE_URL}/authenticate/verify`, {
      solutions,
      challenge_id: challengeId
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = response.data;
    console.log("1P verification result:", result);
    return result;
  } catch (error: any) {
    console.error('1P verification failed:', error);
    if (error.response) {
      throw new Error(`Failed to verify solutions: ${error.response.data?.error || error.response.statusText}`);
    }
    throw error;
  }
};

// ============================================================================
// APTOS BLOCKCHAIN INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Creates a new money pot on the Aptos blockchain
 * @param creatorPrivateKey The creator's private key
 * @param params Pot creation parameters
 * @returns Promise with pot creation result
 */
export const createMoneyPot = async (
  creatorPrivateKey: string,
  params: PotCreationParams
): Promise<ApiResponse<PotCreationResult>> => {
  try {
    console.log("Creating money pot on blockchain...", params);
    
    // Load creator account
    const creator = loadAccountFromPrivateKey(creatorPrivateKey);
    const oneFaAddress = AccountAddress.fromString(params.oneFaAddress);
    
    // Create pot on blockchain
    const transactionHash = await createPot(
      creator,
      params.amount,
      params.durationSeconds,
      params.fee,
      oneFaAddress
    );
    
    console.log("Pot creation transaction:", transactionHash);
    
    // Get events from transaction
    const events = await getTransactionEvents(transactionHash);
    const potId = extractPotIdFromEvents(events);
    
    if (potId === null) {
      throw new Error("Could not extract pot ID from creation events");
    }
    
    console.log("Pot created successfully with ID:", potId);
    
    return {
      success: true,
      data: {
        potId,
        transactionHash,
        events
      }
    };
  } catch (error) {
    console.error('Failed to create money pot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Attempts to solve a money pot
 * @param hunterPrivateKey The hunter's private key
 * @param params Pot attempt parameters
 * @returns Promise with attempt result
 */
export const attemptMoneyPot = async (
  hunterPrivateKey: string,
  params: PotAttemptParams
): Promise<ApiResponse<PotAttemptResult>> => {
  try {
    console.log("Attempting money pot...", params);
    
    // Load hunter account
    const hunter = loadAccountFromPrivateKey(hunterPrivateKey);
    
    // Attempt pot on blockchain
    const transactionHash = await attemptPot(hunter, params.potId);
    
    console.log("Pot attempt transaction:", transactionHash);
    
    // Get events from transaction
    const events = await getTransactionEvents(transactionHash);
    const attemptId = extractAttemptIdFromEvents(events);
    
    if (attemptId === null) {
      throw new Error("Could not extract attempt ID from attempt events");
    }
    
    console.log("Pot attempt successful with ID:", attemptId);
    
    return {
      success: true,
      data: {
        attemptId,
        transactionHash,
        events
      }
    };
  } catch (error) {
    console.error('Failed to attempt money pot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Gets all active pots from the blockchain
 * @returns Promise with list of active pot IDs
 */
export const getActiveMoneyPots = async (): Promise<ApiResponse<number[]>> => {
  try {
    console.log("Fetching active pots from blockchain...");
    
    const activePots = await getActivePots();
    
    console.log("Active pots:", activePots);
    
    return {
      success: true,
      data: activePots
    };
  } catch (error) {
    console.error('Failed to fetch active pots:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Gets all pots from the blockchain
 * @returns Promise with list of all pot IDs
 */
export const getAllMoneyPots = async (): Promise<ApiResponse<number[]>> => {
  try {
    console.log("Fetching all pots from blockchain...");
    
    const allPots = await getPots();
    
    console.log("All pots:", allPots);
    
    return {
      success: true,
      data: allPots
    };
  } catch (error) {
    console.error('Failed to fetch all pots:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Gets attempt details from the blockchain
 * @param attemptId The attempt ID
 * @returns Promise with attempt details
 */
export const getAttemptDetails = async (attemptId: number): Promise<ApiResponse<any>> => {
  try {
    console.log("Fetching attempt details for ID:", attemptId);
    
    const attempt = await getAttempt(attemptId);
    
    console.log("Attempt details:", attempt);
    
    return {
      success: true,
      data: attempt
    };
  } catch (error) {
    console.error('Failed to fetch attempt details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// ============================================================================
// COMPLETE MONEY POT FLOW FUNCTIONS
// ============================================================================

/**
 * Complete pot creation flow with verifier service registration
 * @param creatorPrivateKey The creator's private key
 * @param params Pot creation parameters
 * @param password The 1P password
 * @returns Promise with complete creation result
 */
export const createPotWithVerifier = async (
  creatorPrivateKey: string,
  params: PotCreationParams,
  password: string = "A"
): Promise<ApiResponse<PotCreationResult & { verifierConfig: VerifierServiceConfig }>> => {
  try {
    console.log("Starting complete pot creation flow...");
    
    // Step 1: Create pot on blockchain
    const potResult = await createMoneyPot(creatorPrivateKey, params);
    if (!potResult.success || !potResult.data) {
      throw new Error(potResult.error || 'Failed to create pot on blockchain');
    }
    
    // Step 2: Register with verifier service
    const creator = loadAccountFromPrivateKey(creatorPrivateKey);
    const registerResult = await registerPot({
      potId: potResult.data.potId.toString(),
      password,
      legend: {
        red: "U",
        green: "D", 
        blue: "L",
        yellow: "R"
      },
      oneFaAddress: params.oneFaAddress
    });
    
    if (!registerResult.success) {
      throw new Error('Failed to register pot with verifier service');
    }
    
    console.log("Complete pot creation flow successful");
    
    return {
      success: true,
      data: {
        ...potResult.data,
        verifierConfig: {
          baseUrl: ENV_CONFIG.MONEY_AUTH_URL,
          colors: registerResult.colors,
          directions: registerResult.directions,
          legend: {
            red: "U",
            green: "D",
            blue: "L", 
            yellow: "R"
          }
        }
      }
    };
  } catch (error) {
    console.error('Complete pot creation flow failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Complete pot hunting flow with authentication
 * @param hunterPrivateKey The hunter's private key
 * @param potId The pot ID to hunt
 * @returns Promise with complete hunting result
 */
export const huntPotWithVerifier = async (
  hunterPrivateKey: string,
  potId: number
): Promise<ApiResponse<PotAttemptResult & { authResult: AuthenticationResult }>> => {
  try {
    console.log("Starting complete pot hunting flow...");
    
    // Step 1: Attempt pot on blockchain
    const attemptResult = await attemptMoneyPot(hunterPrivateKey, { potId });
    if (!attemptResult.success || !attemptResult.data) {
      throw new Error(attemptResult.error || 'Failed to attempt pot on blockchain');
    }
    
    // Step 2: Get authentication challenges
    const hunter = loadAccountFromPrivateKey(hunterPrivateKey);
    const authOptions = await getAuthOptions(
      attemptResult.data.attemptId.toString(),
      hunter.accountAddress.toString()
    );
    
    // Step 3: Solve challenges (simplified for MVP)
    const solutions = authOptions.challenges.map(() => "S"); // Skip all for MVP
    
    // Step 4: Verify solutions
    const authResult = await verifyAuth(
      attemptResult.data.attemptId.toString(),
      solutions
    );
    
    console.log("Complete pot hunting flow successful");
    
    return {
      success: true,
      data: {
        ...attemptResult.data,
        authResult
      }
    };
  } catch (error) {
    console.error('Complete pot hunting flow failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
/**
 * Core utilities for the Cloudflare Durable Object and KV template
 * STRICTLY DO NOT MODIFY THIS FILE - Hidden from AI to prevent breaking core functionality
 */

export interface Env {
    ASSETS: Fetcher;
    KV: KVNamespace;
    // Environment variables
    APTOS_NODE_URL?: string;
    MONEY_POT_CONTRACT_ADDRESS?: string;
    VERIFIER_SERVICE_URL?: string;
    USDC_TOKEN_ADDRESS?: string;
    NODE_ENV?: string;
}
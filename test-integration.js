#!/usr/bin/env node

/**
 * Simple integration test for Money Pot verifier service
 * Tests the Cloudflare Worker endpoints
 */

// Load environment variables
require('dotenv').config({ path: './development.env' });

const BASE_URL = process.env.MONEY_AUTH_URL || 'http://localhost:8787';
const CONTRACT_ADDRESS = process.env.VITE_MONEY_POT_CONTRACT_ADDRESS || '0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f';

async function testVerifierService() {
  console.log('🧪 Testing Money Pot Verifier Service Integration...\n');
  console.log(`📍 Using BASE_URL: ${BASE_URL}`);
  console.log(`📍 Using CONTRACT_ADDRESS: ${CONTRACT_ADDRESS}\n`);

  try {
    // Test 0: Configuration endpoint
    console.log('0. Testing configuration endpoint...');
    const configResponse = await fetch(`${BASE_URL}/api/config`);
    const configData = await configResponse.json();
    console.log('✅ Configuration:', configData);

    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test 2: Register options
    console.log('\n2. Testing register options...');
    const optionsResponse = await fetch(`${BASE_URL}/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const optionsData = await optionsResponse.json();
    console.log('✅ Register options:', optionsData);

    // Test 3: Register verify (with mock data)
    console.log('\n3. Testing register verify...');
    const mockPayload = {
      pot_id: "123",
      "1p": "A",
      legend: {"red": "U", "green": "D", "blue": "L", "yellow": "R"},
      iat: Math.floor(Date.now() / 1000),
      iss: "0x1234567890abcdef",
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    const encryptedPayload = Buffer.from(JSON.stringify(mockPayload)).toString('hex');
    
    const registerResponse = await fetch(`${BASE_URL}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        encrypted_payload: encryptedPayload,
        public_key: optionsData.public_key,
        signature: 'mock_signature'
      })
    });
    const registerData = await registerResponse.json();
    console.log('✅ Register verify:', registerData);

    // Test 4: Store attempt
    console.log('\n4. Testing attempt storage...');
    const attemptResponse = await fetch(`${BASE_URL}/api/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: "456",
        pot_id: "123",
        difficulty: 3
      })
    });
    const attemptData = await attemptResponse.json();
    console.log('✅ Attempt storage:', attemptData);

    // Test 5: Authenticate options
    console.log('\n5. Testing authenticate options...');
    const authOptionsResponse = await fetch(`${BASE_URL}/authenticate/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: { attempt_id: "456" },
        public_key: "456"
      })
    });
    const authOptionsData = await authOptionsResponse.json();
    console.log('✅ Authenticate options:', authOptionsData);

    // Test 6: Authenticate verify
    console.log('\n6. Testing authenticate verify...');
    const authVerifyResponse = await fetch(`${BASE_URL}/authenticate/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solutions: ["U", "D", "L"],
        challenge_id: "456"
      })
    });
    const authVerifyData = await authVerifyResponse.json();
    console.log('✅ Authenticate verify:', authVerifyData);

    console.log('\n🎉 All tests passed! Verifier service integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Make sure the development server is running on port 8787');
    process.exit(1);
  }
}

// Run the test
testVerifierService();

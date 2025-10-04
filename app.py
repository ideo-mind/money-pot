#!/usr/bin/env python3
"""
Money Pot End-to-End Application
Integrates with the verifier service for complete pot creation and hunting flow
"""

import asyncio
import json
import os
import sys
from typing import Optional, Dict, Any
import aiohttp
from dotenv import load_dotenv
import base64
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Load environment variables
load_dotenv()

# Add the simulation script to path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'aidocs'))

# Import from simulation script
from simul import (
    AsyncRestClient, Account, create_pot, attempt_pot, attempt_completed,
    get_transaction_events, extract_pot_id_from_events, extract_attempt_id_from_events
)

# Configuration
MONEY_AUTH_URL = os.getenv("MONEY_AUTH_URL","https://auth.money-pot.unreal.art/")
NODE_URL = os.getenv("RPC_URL", "https://fullnode.testnet.aptoslabs.com/v1")
MODULE_ADDR = os.getenv("MONEY_POT_ADDRESS", "0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f")

class VerifierServiceClient:
    """Client for interacting with the Money Pot Verifier Service"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def encrypt_with_rsa(self, data: str, public_key_pem: str) -> str:
        """Encrypt data with RSA public key using OAEP padding"""
        try:
            print(f"Encrypting data length: {len(data)}")
            print(f"Public key PEM (first 100 chars): {public_key_pem[:100]}...")
            
            # Load the public key from PEM format
            public_key = serialization.load_pem_public_key(public_key_pem.encode())
            
            # Encrypt the data
            encrypted = public_key.encrypt(
                data.encode('utf-8'),
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            print(f"Encryption successful, encrypted length: {len(encrypted)}")
            # Return as hex string
            return encrypted.hex()
        except Exception as e:
            print(f"RSA encryption error: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to simple hex encoding for MVP
            return data.encode().hex()
    
    async def health_check(self) -> Dict[str, Any]:
        """Check service health"""
        async with self.session.get(f"{self.base_url}/health") as response:
            return await response.json()
    
    async def register_options(self) -> Dict[str, Any]:
        """Get encryption key for registration"""
        async with self.session.post(f"{self.base_url}/register/options") as response:
            return await response.json()
    
    async def register_verify(self, encrypted_payload: str, public_key: str, signature: str) -> Dict[str, Any]:
        """Register pot with 1P configuration"""
        payload = {
            "encrypted_payload": encrypted_payload,
            "public_key": public_key,
            "signature": signature
        }
        async with self.session.post(
            f"{self.base_url}/register/verify",
            json=payload
        ) as response:
            return await response.json()
    
    async def authenticate_options(self, attempt_id: str, public_key: str) -> Dict[str, Any]:
        """Get authentication challenges"""
        payload = {
            "payload": {"attempt_id": attempt_id},
            "public_key": public_key
        }
        async with self.session.post(
            f"{self.base_url}/authenticate/options",
            json=payload
        ) as response:
            return await response.json()
    
    async def authenticate_verify(self, solutions: list, challenge_id: str) -> Dict[str, Any]:
        """Verify authentication solution"""
        payload = {
            "solutions": solutions,
            "challenge_id": challenge_id
        }
        async with self.session.post(
            f"{self.base_url}/authenticate/verify",
            json=payload
        ) as response:
            return await response.json()

class MoneyPotApp:
    """Main application class for Money Pot flow"""
    
    def __init__(self):
        self.client = None
        self.creator_account = None
        self.hunter_account = None
        self.verifier = None
    
    async def initialize(self):
        """Initialize the application"""
        print("🚀 Initializing Money Pot Application...")
        
        # Initialize Aptos client
        self.client = AsyncRestClient(NODE_URL)
        
        # Load accounts from environment
        self.creator_account = Account.load_key(os.getenv("APTOS_PRIVATE_KEY"))
        self.hunter_account = Account.load_key(os.getenv("HUNTER_PRIVATE_KEY"))
        
        print(f"✅ Creator account: {self.creator_account.address()}")
        print(f"✅ Hunter account: {self.hunter_account.address()}")
        
        # Initialize verifier service client
        self.verifier = VerifierServiceClient(MONEY_AUTH_URL)
        
        # Check verifier service health
        async with self.verifier as verifier:
            health = await verifier.health_check()
            print(f"✅ Verifier service: {health['status']}")
    
    async def create_pot_flow(self, amount: int = 10000, duration_seconds: int = 360, fee: int = 100):
        """Complete pot creation and registration flow"""
        print("\n📦 Creating Money Pot...")
        
        # Step 1: Create pot on blockchain
        print("1. Creating pot on blockchain...")
        create_tx_hash = await create_pot(
            self.client, 
            self.creator_account, 
            amount, 
            duration_seconds, 
            fee, 
            self.hunter_account.address()  # Use hunter as 1FA address
        )
        print(f"   Transaction: {create_tx_hash}")
        
        # Extract pot_id from events
        create_events = await get_transaction_events(self.client, create_tx_hash)
        pot_id = extract_pot_id_from_events(create_events)
        if pot_id is None:
            raise RuntimeError("Could not extract pot_id from creation events")
        print(f"   ✅ Pot ID: {pot_id}")
        
        # Step 2: Register pot with verifier service
        print("2. Registering pot with verifier service...")
        async with self.verifier as verifier:
            # Get encryption key
            register_options = await verifier.register_options()
            print(f"   ✅ Got encryption key: {register_options['key_id']}")
            
            # Create 1P configuration payload (minimize size for RSA encryption)
            current_time = int(asyncio.get_event_loop().time())
            payload = {
                "pot_id": str(pot_id),
                "1p": "A",  # Single character password
                "legend": {"red": "U", "green": "D", "blue": "L", "yellow": "R"},  # Color-based legend
                "iat": current_time,
                "iss": str(self.creator_account.address()),
                "exp": current_time + 3600
            }
            
            # For MVP: send plain text payload (no encryption)
            payload_json = json.dumps(payload)
            print(f"Payload: {payload_json}")
            
            # Send payload as hex string (no encryption for MVP)
            encrypted_payload = payload_json.encode().hex()
            
            # Get creator's public key in hex format for signature verification
            creator_public_key = self.creator_account.public_key().key.encode().hex()
            
            register_result = await verifier.register_verify(
                encrypted_payload,
                register_options["public_key"],  # Use RSA public key for key lookup
                "mock_signature"  # Simplified for MVP
            )
            print(f"   ✅ Pot registered: {register_result}")
        
        return pot_id
    
    async def hunt_pot_flow(self, pot_id: str):
        """Complete treasure hunting flow"""
        print(f"\n🎯 Hunting Pot {pot_id}...")
        
        # Step 1: Attempt pot on blockchain
        print("1. Attempting pot on blockchain...")
        attempt_tx_hash = await attempt_pot(self.client, self.hunter_account, int(pot_id))
        print(f"   Transaction: {attempt_tx_hash}")
        
        # Extract attempt_id from events
        attempt_events = await get_transaction_events(self.client, attempt_tx_hash)
        attempt_id = extract_attempt_id_from_events(attempt_events)
        if attempt_id is None:
            raise RuntimeError("Could not extract attempt_id from attempt events")
        print(f"   ✅ Attempt ID: {attempt_id}")
        
        # Step 2: Get authentication challenges
        print("2. Getting authentication challenges...")
        async with self.verifier as verifier:
            # Use hunter's address as the public key since that's what was used in pot creation
            hunter_address = str(self.hunter_account.address())
            print(f"   Debug: Hunter address: {hunter_address}")
            
            # Use the address directly as the public key
            hunter_public_key = hunter_address
            auth_options = await verifier.authenticate_options(str(attempt_id), hunter_public_key)
            print(f"   ✅ Got {len(auth_options.get('challenges', []))} challenges")
            
            # Step 3: Solve challenges based on strategy
            print("3. Solving challenges...")
            DIRECTIONS = ["U", "D", "L", "R", "S"]  # Single letter format for 1P protocol
            
            # Get strategy from environment variable
            strategy = os.getenv("STRATEGY", "intelligent").lower()
            print(f"   Strategy: {strategy}")
            
            # Get the challenges and solve them based on strategy
            challenges = auth_options.get('challenges', [])
            solutions = []
            
            if strategy == "random":
                # Random strategy: generate random solutions
                import random
                solutions = [random.choice(DIRECTIONS) for _ in range(len(challenges))]
                print(f"   Random solutions: {solutions}")
            else:
                # Intelligent strategy: solve based on color groups and legend
                # We know the password is "A" and the legend mapping
                password = "A"
                legend = {"red": "U", "green": "D", "blue": "L", "yellow": "R"}  # From our registration
                
                for i, challenge in enumerate(challenges):
                    print(f"   Challenge {i+1}: {challenge}")
                    
                    # Get the color groups for this challenge
                    color_groups = challenge.get('colorGroups', {})
                    
                    # Find which color group contains our password character
                    password_color = None
                    for color, chars in color_groups.items():
                        if password in chars:
                            password_color = color
                            break
                    
                    if password_color:
                        # Map color to direction using our legend
                        direction = legend.get(password_color, "S")
                        solutions.append(direction)
                        print(f"   Password '{password}' is in {password_color} group -> {direction}")
                    else:
                        # Fallback to Skip if password not found
                        solutions.append("S")
                        print(f"   Password '{password}' not found in color groups -> Skip")
            
            print(f"   Solutions: {solutions}")
            
            # Step 4: Verify solutions
            print("4. Verifying solutions...")
            verify_result = await verifier.authenticate_verify(solutions, str(attempt_id))
            print(f"   ✅ Authentication result: {verify_result}")
        
        return attempt_id
    
    async def run_complete_flow(self):
        """Run the complete Money Pot flow"""
        try:
            # Initialize
            await self.initialize()
            
            # Create pot
            pot_id = await self.create_pot_flow()
            
            # Hunt pot
            attempt_id = await self.hunt_pot_flow(pot_id)
            
            print(f"\n🎉 Complete flow finished!")
            print(f"   Pot ID: {pot_id}")
            print(f"   Attempt ID: {attempt_id}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            if self.client:
                await self.client.close()

async def main():
    """Main entry point"""
    print("Money Pot End-to-End Application")
    print("=" * 40)
    
    app = MoneyPotApp()
    await app.run_complete_flow()

if __name__ == "__main__":
    asyncio.run(main())

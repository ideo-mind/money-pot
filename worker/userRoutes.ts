import { Hono } from "hono";
import { Env } from './core-utils';

export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Add more routes like this. **DO NOT MODIFY CORS OR OVERRIDE ERROR HANDLERS**
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'this works' }}));

    // Verifier Service Routes for 1P Authentication
    app.post('/register/options', async (c) => {
        try {
            // Generate RSA key pair for encryption
            const keyId = crypto.randomUUID();
            const publicKey = "mock_public_key_" + keyId; // Simplified for MVP
            
            // Store in KV with 5 minute expiry
            await c.env.KV.put(`key_${keyId}`, JSON.stringify({
                keyId,
                publicKey,
                expiry: Date.now() + 300000 // 5 minutes
            }), { expirationTtl: 300 });

            return c.json({
                key_id: keyId,
                public_key: publicKey
            });
        } catch (error) {
            console.error('Register options error:', error);
            return c.json({ error: 'Failed to generate encryption key' }, 500);
        }
    });

    app.post('/register/verify', async (c) => {
        try {
            const { encrypted_payload, public_key, signature } = await c.req.json();
            
            // For MVP: decrypt payload (simplified)
            const payload = JSON.parse(Buffer.from(encrypted_payload, 'hex').toString());
            
            // Verify signature (simplified for MVP)
            const { pot_id, "1p": password, legend, iss } = payload;
            
            // Store in 1P_DB
            await c.env.KV.put(`pot_${pot_id}`, JSON.stringify({
                password,
                legend,
                creator: iss,
                registered_at: Date.now()
            }));

            return c.json({ success: true });
        } catch (error) {
            console.error('Register verify error:', error);
            return c.json({ error: 'Registration failed' }, 400);
        }
    });

    app.post('/authenticate/options', async (c) => {
        try {
            const { payload, public_key } = await c.req.json();
            const { attempt_id } = payload;
            
            // Get attempt from blockchain (simplified)
            const attempt = await c.env.KV.get(`attempt_${attempt_id}`);
            if (!attempt) {
                return c.json({ error: 'Invalid attempt' }, 400);
            }
            
            const attemptData = JSON.parse(attempt);
            const potId = attemptData.pot_id;
            
            // Get pot configuration
            const potConfig = await c.env.KV.get(`pot_${potId}`);
            if (!potConfig) {
                return c.json({ error: 'Pot not registered' }, 400);
            }
            
            const config = JSON.parse(potConfig);
            
            // Generate challenges based on difficulty
            const difficulty = attemptData.difficulty || 3;
            const challenges = [];
            
            for (let i = 0; i < difficulty; i++) {
                const challenge = generateChallenge(config.password, config.legend);
                challenges.push(challenge);
            }
            
            // Store challenge with expiry
            const challengeId = attempt_id;
            await c.env.KV.put(`challenge_${challengeId}`, JSON.stringify({
                challenges,
                pot_id: potId,
                expiry: Date.now() + 300000 // 5 minutes
            }), { expirationTtl: 300 });

            return c.json({
                challenge_id: challengeId,
                challenges
            });
        } catch (error) {
            console.error('Authenticate options error:', error);
            return c.json({ error: 'Failed to get challenges' }, 400);
        }
    });

    app.post('/authenticate/verify', async (c) => {
        try {
            const { solutions, challenge_id } = await c.req.json();
            
            // Get challenge
            const challengeData = await c.env.KV.get(`challenge_${challenge_id}`);
            if (!challengeData) {
                return c.json({ error: 'Challenge expired' }, 400);
            }
            
            const challenge = JSON.parse(challengeData);
            const potId = challenge.pot_id;
            
            // Get pot configuration
            const potConfig = await c.env.KV.get(`pot_${potId}`);
            const config = JSON.parse(potConfig);
            
            // Verify solutions
            const success = verifySolutions(solutions, challenge.challenges, config.password, config.legend);
            
            // Update blockchain via attempt_completed
            // This would call the smart contract in a real implementation
            await c.env.KV.put(`attempt_result_${challenge_id}`, JSON.stringify({
                success,
                timestamp: Date.now()
            }));

            return c.json({ success });
        } catch (error) {
            console.error('Authenticate verify error:', error);
            return c.json({ error: 'Verification failed' }, 400);
        }
    });

    // Store attempt data for challenge generation
    app.post('/api/attempt', async (c) => {
        try {
            const { attempt_id, pot_id, difficulty } = await c.req.json();
            
            await c.env.KV.put(`attempt_${attempt_id}`, JSON.stringify({
                attempt_id,
                pot_id,
                difficulty,
                created_at: Date.now()
            }));

            return c.json({ success: true });
        } catch (error) {
            console.error('Store attempt error:', error);
            return c.json({ error: 'Failed to store attempt' }, 400);
        }
    });

    // Helper functions
    function generateChallenge(password: string, legend: Record<string, string>) {
        // Generate a 5x5 grid with random characters
        const grid = [];
        const colors = ['red', 'green', 'blue', 'yellow'];
        
        for (let i = 0; i < 25; i++) {
            const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            const color = colors[Math.floor(Math.random() * colors.length)];
            grid.push({ id: i, char, color });
        }
        
        // Ensure password character is in the grid
        const passwordIndex = Math.floor(Math.random() * 25);
        grid[passwordIndex] = { id: passwordIndex, char: password, color: colors[Math.floor(Math.random() * colors.length)] };
        
        return {
            targetChar: password,
            grid
        };
    }

    function verifySolutions(solutions: string[], challenges: any[], password: string, legend: Record<string, string>) {
        // Simplified verification for MVP
        // In a real implementation, this would verify each solution against the challenge
        return solutions.length === challenges.length && solutions.every(sol => ['U', 'D', 'L', 'R', 'S'].includes(sol));
    }
}

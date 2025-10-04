import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePotStore } from "@/store/pot-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Loader2, PartyPopper, ShieldClose, SkipForward, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MODULE_ADDRESS, MODULE_NAME, aptos } from "@/lib/aptos";
import { getAuthOptions, verifyAuth } from "@/lib/api";
import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from "@/abis";
import type { money_pot_manager } from "@/abis/0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f";
import { PotCardSkeleton } from "@/components/PotCardSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Account } from "@aptos-labs/ts-sdk";
import { getOneFaKey, storeOneFaKey } from "@/lib/oneFaStorage";
import { useTransactionStore } from "@/store/transaction-store";
type GameState = "idle" | "paying" | "fetching_challenge" | "playing" | "verifying" | "won" | "lost";
type KeyState = "unchecked" | "validating" | "valid" | "invalid";
export function PotChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { connected, signAndSubmitTransaction, account } = useWallet();
  const pot = usePotStore((state) => state.currentPot);
  const loading = usePotStore((state) => state.loading);
  const error = usePotStore((state) => state.error);
  const fetchPotById = usePotStore((state) => state.fetchPotById);
  const addAttempt = usePotStore((state) => state.addAttempt);
  const expirePot = usePotStore((state) => state.expirePot);
  const { addTransaction, updateTransaction } = useTransactionStore();
  const [gameState, setGameState] = useState<GameState>("idle");
  const [oneFaPrivateKey, setOneFaPrivateKey] = useState("");
  const [keyState, setKeyState] = useState<KeyState>("unchecked");
  const [isAutoCompleted, setIsAutoCompleted] = useState(false);
  const [isExpiring, setIsExpiring] = useState(false);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [solutions, setSolutions] = useState<string[]>([]);
  const [attemptId, setAttemptId] = useState<string>("");
  useEffect(() => {
    if (id) {
      fetchPotById(id);
    }
  }, [id, fetchPotById]);
  const validateKey = useCallback(async (key: string) => {
    if (!key || !pot) return;
    setKeyState("validating");
    await new Promise(res => setTimeout(res, 300));
    try {
      // TODO: Fix private key validation - for now just accept any valid hex key
      const hexKey = key.startsWith("0x") ? key.substring(2) : key;
      if (hexKey.length === 64 && /^[0-9a-fA-F]+$/.test(hexKey)) {
        setKeyState("valid");
        // Store the valid key for future use
        storeOneFaKey(pot.one_fa_address, key);
        console.log(`Stored 1FA key for address: ${pot.one_fa_address}`);
      } else {
        setKeyState("invalid");
      }
    } catch (e) {
      setKeyState("invalid");
    }
  }, [pot]);
  // Effect to pre-fill and validate key if available
  useEffect(() => {
    if (pot?.one_fa_private_key) {
      // Use the key from pot data (for mock pots)
      setOneFaPrivateKey(pot.one_fa_private_key);
      validateKey(pot.one_fa_private_key);
      setIsAutoCompleted(false);
    } else if (pot?.one_fa_address) {
      // Check localStorage for stored key
      const storedKey = getOneFaKey(pot.one_fa_address);
      if (storedKey) {
        console.log(`Auto-completing 1FA key for address: ${pot.one_fa_address}`);
        setOneFaPrivateKey(storedKey);
        validateKey(storedKey);
        setIsAutoCompleted(true);
      } else {
        setIsAutoCompleted(false);
      }
    }
  }, [pot, validateKey]);
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setOneFaPrivateKey(key);
    if (keyState !== "unchecked") setKeyState("unchecked");
    setIsAutoCompleted(false); // Reset auto-completed flag when user manually changes key
  };
  const handleAttempt = async () => {
    if (!connected || !pot) return;
    
    // Prevent attempts on expired pots
    if (pot.isExpired) {
      toast.error("This pot has expired and cannot be attempted");
      return;
    }
    
    // 1FA private key is now optional - allow attempts without it
    // if (keyState !== 'valid') return;
    setGameState("paying");
    const toastId = toast.loading("Submitting entry fee transaction...");
    
    // Add transaction to log
    const txId = addTransaction({
      hash: '', // Will be updated when we get the response
      type: 'attempt_pot',
      status: 'pending',
      description: `Attempting Pot #${pot.id}`,
      potId: pot.id,
      amount: `${pot.entryFee} USDC`,
    });
    
    try {
      // Use wallet adapter to sign and submit transaction
      const response = await signAndSubmitTransaction({
        sender: account!.address,
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::attempt_pot_entry`,
          typeArguments: [],
          functionArguments: [BigInt(pot.id).toString()],
        },
      });
      
      // Update transaction with hash
      updateTransaction(txId, { hash: response.hash });
      
      // Wait for transaction to complete
      const result = await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      
      // Debug: Log all events to understand the structure
      console.log("Transaction result:", result);
      console.log("All events:", (result as any).events);
      
      let extractedAttemptId: string | undefined;
      
      // Extract attempt_id from events using proper PotEvent type
      const attemptEvent = (result as any).events?.find((e: any) => {
        console.log("Checking event:", e);
        // Look for PotEvent with event_type containing "attempted"
        if (e.type.includes("PotEvent")) {
          const eventData = e.data as money_pot_manager.PotEvent;
          console.log("PotEvent data:", eventData);
          return eventData.event_type.includes("attempted");
        }
        return false;
      });
      
      if (attemptEvent) {
        const eventData = attemptEvent.data as money_pot_manager.PotEvent;
        extractedAttemptId = eventData.id.toString();
        console.log("Extracted attempt_id from PotEvent:", extractedAttemptId);
      } else {
        // Fallback: try to find any event that might contain attempt information
        console.log("No PotEvent found, trying fallback...");
        const fallbackEvent = (result as any).events?.find((e: any) => 
          e.type.includes("money_pot") || e.type.includes("attempt") || e.type.includes("attempted")
        );
        
        if (fallbackEvent) {
          console.log("Found fallback event:", fallbackEvent);
          // Try to extract attempt_id from various possible locations
          extractedAttemptId = fallbackEvent.data?.attempt_id?.toString() || 
                              fallbackEvent.data?.id?.toString() || 
                              fallbackEvent.data?.value?.toString();
          if (extractedAttemptId) {
            console.log("Extracted attempt_id from fallback:", extractedAttemptId);
          } else {
            throw new Error(`Could not extract attempt_id from fallback event: ${JSON.stringify(fallbackEvent)}`);
          }
        } else {
          throw new Error(`Could not find any relevant event in transaction result. Available events: ${JSON.stringify((result as any).events)}`);
        }
      }
      
      if (!extractedAttemptId) {
        throw new Error("Could not extract attempt_id from any event.");
      }
      
      // Store attempt_id for later use in verification
      setAttemptId(extractedAttemptId);
      
      toast.success("Entry fee paid! Starting 1P authentication...", { id: toastId });
      setGameState("fetching_challenge");
      
      // Step 2: Get 1P authentication challenges from verifier service
      // Use the hunter's address as the public key (as per app.py reference)
      const hunterAddress = account!.address;
      console.log("Getting 1P challenges for hunter:", hunterAddress);
      
      const { challenges: fetchedChallenges } = await getAuthOptions(extractedAttemptId.toString(), hunterAddress.toString());
      console.log("Received 1P challenges:", fetchedChallenges);
      
      // Set challenges for human interaction
      setChallenges(fetchedChallenges);
      setCurrentRound(0);
      setSolutions([]);
      setGameState("playing");
      
      // Update transaction as successful
      updateTransaction(txId, { 
        status: 'success',
        description: `Successfully paid entry fee for Pot #${pot.id}`
      });
    } catch (error) {
      // Update transaction as failed
      updateTransaction(txId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast.error("Failed to pay entry fee.", { id: toastId, description: (error as Error).message });
      setGameState("idle");
    }
  };
  const submitMove = async (move: string) => {
    const newSolutions = [...solutions, move];
    setSolutions(newSolutions);
    
    if (currentRound < challenges.length - 1) {
      // Move to next challenge
      setCurrentRound(currentRound + 1);
      toast.success(`Round ${currentRound + 1} completed! Moving to next challenge...`);
    } else {
      // All challenges completed - verify with 1P verifier service
      setGameState("verifying");
      const toastId = toast.loading("Verifying your 1P authentication...");
      
      try {
        // Verify solutions with verifier service using attempt_id as challenge_id
        const { success } = await verifyAuth(attemptId.toString(), newSolutions);
        
        // Update blockchain with result
        await signAndSubmitTransaction({
          sender: account!.address,
          data: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::attempt_completed`,
            typeArguments: [],
            functionArguments: [BigInt(attemptId).toString(), success],
          },
        });
        
        addAttempt({ potId: pot!.id, potTitle: pot!.title, status: success ? 'won' : 'lost', date: new Date().toISOString() });
        
        if (success) {
          toast.success("🎉 Congratulations! You've solved the 1P challenge!", { id: toastId });
          setGameState("won");
        } else {
          toast.error("❌ 1P authentication failed. Better luck next time!", { id: toastId });
          setGameState("lost");
        }
      } catch (error) {
        console.error("1P verification failed:", error);
        toast.error("1P verification failed.", { id: toastId, description: (error as Error).message });
        setGameState("lost");
      }
    }
  };

  const handleExpirePot = async () => {
    if (!pot || !connected || !account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsExpiring(true);
    
    // Add transaction to log
    const txId = addTransaction({
      hash: '', // Will be updated when we get the response
      type: 'expire_pot',
      status: 'pending',
      description: `Expiring Pot #${pot.id}`,
      potId: pot.id,
    });
    
    try {
      // Submit blockchain transaction
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::expire_pot`,
          typeArguments: [],
          functionArguments: [BigInt(pot.id).toString()],
        },
      });
      
      // Update transaction with hash
      updateTransaction(txId, { hash: response.hash });
      
      // Wait for transaction to complete
      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      
      // Update local state
      const success = await expirePot(pot.id);
      if (success) {
        // Update transaction as successful
        updateTransaction(txId, { 
          status: 'success',
          description: `Successfully expired Pot #${pot.id}`
        });
        
        toast.success("Pot expired successfully!");
        // Refresh the pot data
        await fetchPotById(pot.id);
      } else {
        // Update transaction as failed
        updateTransaction(txId, { 
          status: 'failed', 
          error: 'Failed to update local state'
        });
        
        toast.error("Failed to expire pot");
      }
    } catch (error) {
      console.error('Failed to expire pot:', error);
      
      // Update transaction as failed
      updateTransaction(txId, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast.error("Failed to expire pot");
    } finally {
      setIsExpiring(false);
    }
  };

  const KeyIcon = useMemo(() => {
    switch (keyState) {
      case "validating": return <Loader2 className="h-4 w-4 animate-spin" />;
      case "valid": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "invalid": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <KeyRound className="h-4 w-4 text-muted-foreground" />;
    }
  }, [keyState]);
  if (loading || (!pot && !error)) {
    return <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8"><PotCardSkeleton /></div>;
  }
  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">Error</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button onClick={() => navigate('/pots')} className="mt-4">Back to Pots</Button>
      </div>
    );
  }
  if (!pot) return null;
  const currentChallenge = challenges[currentRound];
  return (
    <div className="max-w-5xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <Toaster richColors position="top-right" />
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold">{pot.title}</h1>
        {gameState === "playing" && <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Round {currentRound + 1} of {pot.difficulty}. Focus.</p>}
      </div>
      {gameState === "idle" && (
        <Card className="text-center p-8 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-display">Ready to Hunt?</CardTitle>
            <CardDescription>Optionally enter the 1FA private key for this pot, or proceed without it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="1fa-key">1FA Private Key (Optional)</Label>
              <div className="relative">
                <Input 
                  id="1fa-key" 
                  placeholder="0x..." 
                  value={oneFaPrivateKey} 
                  onChange={handleKeyChange} 
                  className={`pr-10 ${isAutoCompleted ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">{KeyIcon}</div>
              </div>
              {isAutoCompleted && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Auto-completed from stored keys
                </p>
              )}
              <div className="flex justify-end">
                <Button variant="link" size="sm" onClick={() => validateKey(oneFaPrivateKey)} disabled={!oneFaPrivateKey || keyState === 'validating'}>Validate Key</Button>
              </div>
            </div>
            <p className="text-lg">Pay the entry fee of <span className="font-bold text-brand-gold">{pot.entryFee} USDC</span> to begin.</p>
            <div className="space-y-3">
              <Button 
                onClick={handleAttempt} 
                disabled={!connected || pot.isExpired} 
                size="lg" 
                className="w-full max-w-xs mx-auto bg-brand-green hover:bg-brand-green/90 text-white font-bold text-lg h-16"
              >
                {pot.isExpired ? "Pot Expired" : connected ? `Pay ${pot.entryFee} USDC & Start` : "Connect Wallet to Start"}
              </Button>
              
              {/* Show expire button if pot is expired but still active */}
              {pot.isExpired && pot.is_active && (
                <div className="text-center">
                  <Button 
                    onClick={handleExpirePot}
                    disabled={isExpiring}
                    variant="destructive"
                    size="sm"
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isExpiring ? (
                      <>
                        <XCircle className="mr-2 h-4 w-4 animate-spin" />
                        Expiring...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Expire Pot
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    This pot has timed out but is still active
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {(gameState === "paying" || gameState === "fetching_challenge") && (
        <div className="text-center p-8 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-brand-green" />
          <p className="text-xl font-semibold">{gameState === "paying" ? "Processing transaction..." : "Getting 1P challenges..."}</p>
        </div>
      )}
      {gameState === "playing" && currentChallenge && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  1P Challenge {currentRound + 1} of {challenges.length}
                </CardTitle>
                <CardDescription className="text-center">
                  Find the character: <span className="text-brand-gold font-mono text-2xl">{currentChallenge.targetChar}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 aspect-square">
                  {currentChallenge.grid.map((cell: any) => (
                    <div key={cell.id} className={`w-full h-full rounded-md flex items-center justify-center text-white font-bold text-2xl ${cell.color}`}>
                      {cell.char}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Look for the target character and choose the direction based on its color group
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>1P Directions</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <div></div>
                <Button onClick={() => submitMove("U")} size="lg" variant="outline" className="h-16"><ArrowUp /></Button>
                <div></div>
                <Button onClick={() => submitMove("L")} size="lg" variant="outline" className="h-16"><ArrowLeft /></Button>
                <Button onClick={() => submitMove("D")} size="lg" variant="outline" className="h-16"><ArrowDown /></Button>
                <Button onClick={() => submitMove("R")} size="lg" variant="outline" className="h-16"><ArrowRight /></Button>
              </CardContent>
            </Card>
            <Button onClick={() => submitMove("S")} size="lg" variant="secondary" className="w-full h-16 text-lg">
              <SkipForward className="mr-2" /> Skip (S)
            </Button>
            <div className="text-xs text-muted-foreground text-center">
              <p>U=Up, D=Down, L=Left, R=Right, S=Skip</p>
              <p>Round {currentRound + 1} of {challenges.length}</p>
            </div>
          </div>
        </div>
      )}
      {(gameState === "won" || gameState === "lost" || gameState === "verifying") && (
        <Card className="text-center p-12 flex flex-col items-center space-y-6">
          {gameState === "verifying" && <Loader2 className="w-24 h-24 animate-spin text-brand-green" />}
          {gameState === "won" && <PartyPopper className="w-24 h-24 text-brand-gold" />}
          {gameState === "lost" && <ShieldClose className="w-24 h-24 text-destructive" />}
          <h2 className="text-4xl font-display font-bold">
            {gameState === "verifying" && "Verifying 1P Authentication..."}
            {gameState === "won" && "1P Challenge Solved!"}
            {gameState === "lost" && "1P Authentication Failed"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {gameState === "verifying" && "Checking your 1P solutions with the verifier service..."}
            {gameState === "won" && `🎉 Congratulations! You've successfully solved the 1P challenge! ${pot.potentialReward.toLocaleString()} USDC is on its way to your wallet.`}
            {gameState === "lost" && "❌ 1P authentication failed. The pot remains locked. Better luck next time!"}
          </p>
          <Button onClick={() => navigate('/pots')} size="lg">Back to Pots</Button>
        </Card>
      )}
    </div>
  );
}
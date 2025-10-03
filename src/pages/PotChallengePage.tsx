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
import { Account, PrivateKey } from "@aptos-labs/ts-sdk";
type GameState = "idle" | "paying" | "fetching_challenge" | "playing" | "verifying" | "won" | "lost";
type KeyState = "unchecked" | "validating" | "valid" | "invalid";
export function PotChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { connected, signAndSubmitTransaction } = useWallet();
  const pot = usePotStore((state) => state.currentPot);
  const loading = usePotStore((state) => state.loading);
  const error = usePotStore((state) => state.error);
  const fetchPotById = usePotStore((state) => state.fetchPotById);
  const addAttempt = usePotStore((state) => state.addAttempt);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [oneFaPrivateKey, setOneFaPrivateKey] = useState("");
  const [keyState, setKeyState] = useState<KeyState>("unchecked");
  const [challenges, setChallenges] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [solutions, setSolutions] = useState<string[]>([]);
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
      // FIX: Use the correct static method `fromHex` and handle the "0x" prefix.
      const hexKey = key.startsWith("0x") ? key.substring(2) : key;
      const privateKeyObject = PrivateKey.fromHex(hexKey);
      const account = Account.fromPrivateKey({ privateKey: privateKeyObject });
      if (account.accountAddress.toString() === pot.one_fa_address) {
        setKeyState("valid");
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
      setOneFaPrivateKey(pot.one_fa_private_key);
      validateKey(pot.one_fa_private_key);
    }
  }, [pot, validateKey]);
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.value;
    setOneFaPrivateKey(key);
    if (keyState !== "unchecked") setKeyState("unchecked");
  };
  const handleAttempt = async () => {
    if (!connected || !pot || keyState !== 'valid') return;
    setGameState("paying");
    const toastId = toast.loading("Submitting entry fee transaction...");
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
      
      // Wait for transaction to complete
      const result = await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      
      // Extract attempt_id from events using proper PotEvent type
      const attemptEvent = (result as any).events?.find((e: any) => {
        // Look for PotEvent with event_type containing "attempted"
        if (e.type.includes("PotEvent")) {
          const eventData = e.data as money_pot_manager.PotEvent;
          return eventData.event_type.includes("attempted");
        }
        return false;
      });
      
      if (!attemptEvent) {
        throw new Error("Could not find AttemptEvent in transaction result.");
      }
      
      const eventData = attemptEvent.data as money_pot_manager.PotEvent;
      const attemptId = eventData.id;
      if (!attemptId) {
        throw new Error("Could not extract attempt_id from PotEvent data.");
      }
      
      toast.success("Entry fee paid! Fetching challenge...", { id: toastId });
      setGameState("fetching_challenge");
      
      // Store attempt in verifier service for challenge generation
      await fetch('/api/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId.toString(),
          pot_id: pot.id,
          difficulty: pot.difficulty
        })
      });
      
      const { challenges: fetchedChallenges } = await getAuthOptions(attemptId.toString());
      setChallenges(fetchedChallenges.slice(0, pot.difficulty));
      setGameState("playing");
    } catch (error) {
      toast.error("Failed to pay entry fee.", { id: toastId, description: (error as Error).message });
      setGameState("idle");
    }
  };
  const submitMove = async (move: string) => {
    const newSolutions = [...solutions, move];
    setSolutions(newSolutions);
    if (currentRound < challenges.length - 1) {
      setCurrentRound(currentRound + 1);
    } else {
      setGameState("verifying");
      const toastId = toast.loading("Verifying your solution...");
      
      try {
        // Verify with verifier service
        const { success } = await verifyAuth(pot!.id, newSolutions);
        
        // Update blockchain with result
        await signAndSubmitTransaction({
          sender: account!.address,
          data: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::attempt_completed`,
            typeArguments: [],
            functionArguments: [BigInt(pot!.id).toString(), success],
          },
        });
        
        addAttempt({ potId: pot!.id, potTitle: pot!.title, status: success ? 'won' : 'lost', date: new Date().toISOString() });
        
        if (success) {
          toast.success("Congratulations! You've won!", { id: toastId });
          setGameState("won");
        } else {
          toast.error("Incorrect solution. Better luck next time!", { id: toastId });
          setGameState("lost");
        }
      } catch (error) {
        console.error("Verification failed:", error);
        toast.error("Verification failed.", { id: toastId, description: (error as Error).message });
        setGameState("lost");
      }
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
            <CardDescription>Enter the 1FA private key for this pot to proceed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="1fa-key">1FA Private Key</Label>
              <div className="relative">
                <Input id="1fa-key" placeholder="0x..." value={oneFaPrivateKey} onChange={handleKeyChange} className="pr-10" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">{KeyIcon}</div>
              </div>
              <div className="flex justify-end">
                <Button variant="link" size="sm" onClick={() => validateKey(oneFaPrivateKey)} disabled={!oneFaPrivateKey || keyState === 'validating'}>Validate Key</Button>
              </div>
            </div>
            <p className="text-lg">Pay the entry fee of <span className="font-bold text-brand-gold">{pot.entryFee} USDC</span> to begin.</p>
            <Button onClick={handleAttempt} disabled={!connected || keyState !== 'valid'} size="lg" className="w-full max-w-xs mx-auto bg-brand-green hover:bg-brand-green/90 text-white font-bold text-lg h-16">
              {connected ? `Pay ${pot.entryFee} USDC & Start` : "Connect Wallet to Start"}
            </Button>
          </CardContent>
        </Card>
      )}
      {(gameState === "paying" || gameState === "fetching_challenge") && (
        <div className="text-center p-8 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-brand-green" />
          <p className="text-xl font-semibold">{gameState === "paying" ? "Processing transaction..." : "Fetching challenge..."}</p>
        </div>
      )}
      {gameState === "playing" && currentChallenge && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Find the character: <span className="text-brand-gold font-mono text-3xl">{currentChallenge.targetChar}</span></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 aspect-square">
                  {currentChallenge.grid.map((cell: any) => (
                    <div key={cell.id} className={`w-full h-full rounded-md flex items-center justify-center text-white font-bold text-2xl ${cell.color}`}>
                      {cell.char}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Your Moves</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                <div></div>
                <Button onClick={() => submitMove("Up")} size="lg" variant="outline" className="h-16"><ArrowUp /></Button>
                <div></div>
                <Button onClick={() => submitMove("Left")} size="lg" variant="outline" className="h-16"><ArrowLeft /></Button>
                <Button onClick={() => submitMove("Down")} size="lg" variant="outline" className="h-16"><ArrowDown /></Button>
                <Button onClick={() => submitMove("Right")} size="lg" variant="outline" className="h-16"><ArrowRight /></Button>
              </CardContent>
            </Card>
            <Button onClick={() => submitMove("Skip")} size="lg" variant="secondary" className="w-full h-16 text-lg">
              <SkipForward className="mr-2" /> Skip
            </Button>
          </div>
        </div>
      )}
      {(gameState === "won" || gameState === "lost" || gameState === "verifying") && (
        <Card className="text-center p-12 flex flex-col items-center space-y-6">
          {gameState === "verifying" && <Loader2 className="w-24 h-24 animate-spin text-brand-green" />}
          {gameState === "won" && <PartyPopper className="w-24 h-24 text-brand-gold" />}
          {gameState === "lost" && <ShieldClose className="w-24 h-24 text-destructive" />}
          <h2 className="text-4xl font-display font-bold">
            {gameState === "verifying" && "Verifying..."}
            {gameState === "won" && "You Won!"}
            {gameState === "lost" && "Challenge Failed"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {gameState === "verifying" && "Checking your answers against the blockchain..."}
            {gameState === "won" && `Congratulations! ${pot.potentialReward.toLocaleString()} USDC is on its way to your wallet.`}
            {gameState === "lost" && "The pot remains locked. Better luck next time!"}
          </p>
          <Button onClick={() => navigate('/pots')} size="lg">Back to Pots</Button>
        </Card>
      )}
    </div>
  );
}
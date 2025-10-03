import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Wand2, Loader2, Terminal, Eye, EyeOff, Shuffle, Calendar as CalendarIcon, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Account, U64 } from "@aptos-labs/ts-sdk";
import { MODULE_ADDRESS, MODULE_NAME, aptos } from "@/lib/aptos";
import { registerPot } from "@/lib/api";
import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from "@/abis";
import type { money_pot_manager } from "@/abis/0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CopyableInput } from "@/components/CopyableInput";
import { MAPPABLE_DIRECTIONS, CHARACTER_DOMAINS, COLORS } from "@/lib/constants";
import { ColorDirectionMapper } from "@/components/ColorDirectionMapper";
import { CharacterSelector } from "@/components/CharacterSelector";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { usePotStore, transformToPot } from "@/store/pot-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
const steps = [
  { id: 1, name: "Define Pot" },
  { id: 2, name: "Set Rules" },
  { id: 3, name: "Configure Challenge" },
  { id: 4, name: "Review & Deposit" },
];
export function CreatePotPage() {
  const { signAndSubmitTransaction, connected, account } = useWallet();
  const addPot = usePotStore((state) => state.addPot);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [amount, setAmount] = useState(0.01);
  const [duration, setDuration] = useState(1);
  const [durationType, setDurationType] = useState<'days' | 'weeks' | 'months' | 'custom'>('days');
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [entryFee, setEntryFee] = useState(0.01);
  const [oneFaAddress, setOneFaAddress] = useState('');
  const [oneFaPrivateKey, setOneFaPrivateKey] = useState('');
  const [password, setPassword] = useState("");
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState(false);
  useEffect(() => {
    const allCharacters = Object.values(CHARACTER_DOMAINS).flat();
    const randomChar = allCharacters[Math.floor(Math.random() * allCharacters.length)];
    setPassword(randomChar);
    toast.info("Random 1P character chosen by default", {
      description: "You can change it in Step 3.",
    });
  }, []);
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const getDurationInSeconds = () => {
    if (durationType === 'custom' && customEndDate) {
      const now = new Date();
      const diffMs = customEndDate.getTime() - now.getTime();
      return Math.max(0, Math.floor(diffMs / 1000));
    }
    
    switch (durationType) {
      case 'days':
        return duration * 24 * 60 * 60;
      case 'weeks':
        return duration * 7 * 24 * 60 * 60;
      case 'months':
        return duration * 30 * 24 * 60 * 60; // Approximate month as 30 days
      default:
        return duration * 24 * 60 * 60;
    }
  };

  const getDurationDisplay = () => {
    if (durationType === 'custom' && customEndDate) {
      const now = new Date();
      const diffMs = customEndDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return `${diffDays} days (until ${customEndDate.toLocaleDateString()})`;
    }
    
    switch (durationType) {
      case 'days':
        return `${duration} day${duration !== 1 ? 's' : ''}`;
      case 'weeks':
        return `${duration} week${duration !== 1 ? 's' : ''}`;
      case 'months':
        return `${duration} month${duration !== 1 ? 's' : ''}`;
      default:
        return `${duration} day${duration !== 1 ? 's' : ''}`;
    }
  };

  const getIsStepComplete = () => {
    switch (currentStep) {
      case 1:
        return amount > 0 && (durationType === 'custom' ? customEndDate && customEndDate > new Date() : duration > 0);
      case 2:
        return !!oneFaPrivateKey;
      case 3:
        return !!password && Object.keys(colorMap).length === MAPPABLE_DIRECTIONS.length;
      default:
        return true;
    }
  };
  const generate1FA = () => {
    const oneFaAccount = Account.generate();
    setOneFaAddress(oneFaAccount.accountAddress.toString());
    const rawPrivateKey = oneFaAccount.privateKey.toString().replace("ed25519-priv-0x", "");
    const privateKey = `0x${rawPrivateKey}`;
    setOneFaPrivateKey(privateKey);
    toast.success("1FA Key Generated!", {
      description: "Save the private key securely. It is NOT recoverable.",
    });
  };
  const handleEntryFeeChange = (value: number) => {
    const minFee = 0.0001;
    const maxFee = amount > 0 ? amount / 100 : 0.01;
    const clampedValue = Math.max(minFee, Math.min(value, maxFee));
    setEntryFee(clampedValue);
  };
  const randomizeColorMap = () => {
    const shuffledDirections = [...MAPPABLE_DIRECTIONS];
    for (let i = shuffledDirections.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDirections[i], shuffledDirections[j]] = [shuffledDirections[j], shuffledDirections[i]];
    }
    const newColorMap: Record<string, string> = {};
    COLORS.forEach((color, index) => {
      newColorMap[color.class] = shuffledDirections[index];
    });
    setColorMap(newColorMap);
    toast.info("Color mapping has been randomized!");
  };
  const handleCreatePot = async () => {
    if (!connected || !account) {
      toast.error("Please connect your wallet first.");
      return;
    }
    if (!oneFaAddress || !password || Object.keys(colorMap).length < MAPPABLE_DIRECTIONS.length) {
      toast.error("Please complete all fields in the previous steps.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting transaction to Aptos...");
    try {
      const amountInOctas = BigInt(Math.floor(amount * 1_000_000));
      const entryFeeInOctas = BigInt(Math.floor(entryFee * 1_000_000));
      const durationInSeconds = BigInt(getDurationInSeconds());
      
      // Use wallet adapter to sign and submit transaction
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_pot_entry`,
          typeArguments: [],
          functionArguments: [
            amountInOctas.toString(),
            durationInSeconds.toString(),
            entryFeeInOctas.toString(),
            oneFaAddress,
          ],
        },
      });
      
      // Wait for transaction to complete
      const result = await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      
      // Debug: Log all events to understand the structure
      console.log("Transaction result:", result);
      console.log("All events:", (result as any).events);
      
      let potId: string | undefined;
      
      // Extract pot_id from events using proper PotEvent type
      const potCreatedEvent = (result as any).events?.find((e: any) => {
        console.log("Checking event:", e);
        // Look for PotEvent with event_type containing "created"
        if (e.type.includes("PotEvent")) {
          const eventData = e.data as money_pot_manager.PotEvent;
          console.log("PotEvent data:", eventData);
          return eventData.event_type.includes("created");
        }
        return false;
      });
      
      if (potCreatedEvent) {
        const eventData = potCreatedEvent.data as money_pot_manager.PotEvent;
        potId = eventData.id.toString();
        console.log("Extracted pot_id from PotEvent:", potId);
      } else {
        // Fallback: try to find any event that might contain pot information
        console.log("No PotEvent found, trying fallback...");
        const fallbackEvent = (result as any).events?.find((e: any) => 
          e.type.includes("money_pot") || e.type.includes("created") || e.type.includes("pot")
        );
        
        if (fallbackEvent) {
          console.log("Found fallback event:", fallbackEvent);
          // Try to extract pot_id from various possible locations
          potId = fallbackEvent.data?.pot_id?.toString() || fallbackEvent.data?.id?.toString() || fallbackEvent.data?.value?.toString();
          if (potId) {
            console.log("Extracted pot_id from fallback:", potId);
          } else {
            throw new Error(`Could not extract pot_id from fallback event: ${JSON.stringify(fallbackEvent)}`);
          }
        } else {
          throw new Error(`Could not find any relevant event in transaction result. Available events: ${JSON.stringify((result as any).events)}`);
        }
      }
      
      if (!potId) {
        throw new Error("Could not extract pot_id from any event.");
      }
      
      toast.loading("Registering pot with verifier...", { id: toastId });
      
      // Register with verifier service
      await registerPot({ 
        potId: potId.toString(), 
        password, 
        legend: colorMap, 
        oneFaAddress 
      });
      
      // Fetch the created pot from blockchain
      const [potData] = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getPot(aptos, {
        functionArguments: [BigInt(potId)]
      });
      
      const newPot = transformToPot(potData);
      addPot(newPot);
      
      toast.dismiss(toastId);
      setCreationSuccess(true);
      setTimeout(() => navigate("/pots"), 3000);
    } catch (error) {
      console.error("Pot creation failed:", error);
      toast.error("Pot creation failed.", { id: toastId, description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <Toaster richColors position="top-right" />
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Create a New Money Pot</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Follow the steps to set up your treasure hunt.</p>
        </div>
        {!creationSuccess && (
          <>
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center w-full">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${currentStep >= step.id ? 'bg-brand-green text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {step.id}
                  </div>
                  <p className={`ml-4 font-medium ${currentStep >= step.id ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500'}`}>{step.name}</p>
                  {index < steps.length - 1 && <div className={`flex-auto border-t-2 mx-4 ${currentStep > step.id ? 'border-brand-green' : 'border-slate-200 dark:border-slate-700'}`}></div>}
                </div>
              ))}
            </div>
            <Card className="overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 1 && (
                    <div>
                      <CardHeader>
                        <CardTitle className="font-display text-2xl">Step 1: Define Your Pot</CardTitle>
                        <CardDescription>Set the total USDC amount and how long the pot will be active.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Pot Amount (USDC)</Label>
                          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="e.g., 1000" min="0.001" />
                        </div>
                        <div className="space-y-4">
                          <Label>Duration</Label>
                          <div className="space-y-3">
                            <Select value={durationType} onValueChange={(value: 'days' | 'weeks' | 'months' | 'custom') => setDurationType(value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="days">Days</SelectItem>
                                <SelectItem value="weeks">Weeks</SelectItem>
                                <SelectItem value="months">Months</SelectItem>
                                <SelectItem value="custom">Custom End Date</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {durationType === 'custom' ? (
                              <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {customEndDate ? customEndDate.toLocaleDateString() : "Select end date"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={customEndDate}
                                      onSelect={setCustomEndDate}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                {customEndDate && (
                                  <p className="text-sm text-muted-foreground">
                                    Pot will expire on {customEndDate.toLocaleDateString()} at {customEndDate.toLocaleTimeString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label>Number of {durationType}</Label>
                                <Slider 
                                  value={[duration]} 
                                  onValueChange={(val) => setDuration(val[0])} 
                                  min={1} 
                                  max={durationType === 'days' ? 365 : durationType === 'weeks' ? 52 : 12} 
                                  step={1} 
                                />
                                <p className="text-sm text-muted-foreground">
                                  {duration} {durationType} ({getDurationDisplay()})
                                </p>
                              </div>
                            )}
                            
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">Total Duration:</span>
                                <span>{getDurationDisplay()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  )}
                  {currentStep === 2 && (
                    <div>
                      <CardHeader>
                        <CardTitle className="font-display text-2xl">Step 2: Set the Rules</CardTitle>
                        <CardDescription>Configure the entry fee and generate the unique key for this pot.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <Label>Entry Fee (USDC)</Label>
                          <div className="flex items-center gap-4">
                            <Input
                              type="number"
                              value={entryFee}
                              onChange={(e) => handleEntryFeeChange(parseFloat(e.target.value) || 0)}
                              min={0.0001}
                              step={0.01}
                              className="w-32"
                            />
                            <Slider
                              value={[entryFee]}
                              onValueChange={(val) => handleEntryFeeChange(val[0])}
                              min={Math.max(0.0001, amount / 1000)}
                              max={amount / 100}
                              step={0.01}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">Recommended between 1/1000th and 1/100th of the pot amount.</p>
                        </div>
                        <div className="space-y-2">
                          <Label>1FA Key Pair</Label>
                          <Button variant="outline" onClick={generate1FA} className="w-full">
                            <Wand2 className="mr-2 h-4 w-4" /> Generate 1FA Key
                          </Button>
                          {oneFaPrivateKey && (
                            <>
                              <CopyableInput value={oneFaPrivateKey} />
                              <Alert variant="destructive" className="mt-4">
                                <Terminal className="h-4 w-4" />
                                <AlertTitle>CRITICAL: Save Your Private Key!</AlertTitle>
                                <AlertDescription>
                                  This key is NOT recoverable. Store it in a secure password manager immediately. You will need to share it with treasure hunters.
                                </AlertDescription>
                              </Alert>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  )}
                  {currentStep === 3 && (
                    <div>
                      <CardHeader>
                        <CardTitle className="font-display text-2xl">Step 3: Configure the Challenge</CardTitle>
                        <CardDescription>Set the secret character and map colors to directions for the verifier.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label>Secret Character</Label>
                          <CharacterSelector value={password} onSelect={setPassword} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <Label>Color-to-Direction Mapping</Label>
                              <p className="text-sm text-muted-foreground">Drag directions to map them to a color.</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={randomizeColorMap}>
                              <Shuffle className="mr-2 h-4 w-4" />
                              Randomize
                            </Button>
                          </div>
                          <ColorDirectionMapper colorMap={colorMap} setColorMap={setColorMap} />
                        </div>
                      </CardContent>
                    </div>
                  )}
                  {currentStep === 4 && (
                    <div>
                      <CardHeader>
                        <CardTitle className="font-display text-2xl">Step 4: Review & Deposit</CardTitle>
                        <CardDescription>Confirm the details of your Money Pot before creating it.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between"><span>Pot Amount:</span> <span className="font-medium">${amount} USDC</span></li>
                          <li className="flex justify-between"><span>Duration:</span> <span className="font-medium">{duration} days</span></li>
                          <li className="flex justify-between"><span>Entry Fee:</span> <span className="font-medium">${entryFee.toFixed(4)} USDC</span></li>
                          <li className="flex justify-between items-center">
                            <span>Password:</span>
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="font-display font-bold text-2xl bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded w-12 text-center cursor-help">
                                      {password ? (isPasswordVisible ? password : "•") : "N/A"}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Unicode: U+{password?.codePointAt(0)?.toString(16).toUpperCase()}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Button variant="ghost" size="icon" onClick={() => setIsPasswordVisible(!isPasswordVisible)} disabled={!password}>
                                {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </li>
                          <li className="flex justify-between"><span>1FA Address:</span> <span className="font-mono text-xs">{oneFaAddress ? `${oneFaAddress.slice(0,10)}...` : "Not generated"}</span></li>
                        </ul>
                        <Button onClick={handleCreatePot} disabled={isSubmitting || !connected || !oneFaAddress || !password || Object.keys(colorMap).length < MAPPABLE_DIRECTIONS.length} className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold text-lg py-6">
                          {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : `Deposit ${amount} USDC & Create Pot`}
                        </Button>
                      </CardContent>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              <CardFooter className="flex justify-between p-6 bg-slate-50 dark:bg-slate-900/50">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>Previous</Button>
                <Button onClick={nextStep} disabled={currentStep === steps.length || !getIsStepComplete()}>Next</Button>
              </CardFooter>
            </Card>
          </>
        )}
        {creationSuccess && (
          <Card>
            <CardContent>
              <SuccessAnimation />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
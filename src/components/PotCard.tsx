import { Pot } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, DollarSign, Gem, Shield, XCircle, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { usePotStore } from "@/store/pot-store";
import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MODULE_ADDRESS, MODULE_NAME, aptos } from "@/lib/aptos";
interface PotCardProps {
  pot: Pot;
}
export function PotCard({ pot }: PotCardProps) {
  const isHot = parseInt(pot.attempts_count) > 10;
  const expirePot = usePotStore((state) => state.expirePot);
  const [isExpiring, setIsExpiring] = useState(false);
  const { signAndSubmitTransaction, connected, account } = useWallet();
  
  const handleExpirePot = async () => {
    if (!connected || !account) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    setIsExpiring(true);
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
      
      // Wait for transaction to complete
      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });
      
      // Update local state
      const success = await expirePot(pot.id);
      if (success) {
        toast.success("Pot expired successfully!");
      } else {
        toast.error("Failed to expire pot");
      }
    } catch (error) {
      console.error('Failed to expire pot:', error);
      toast.error("Failed to expire pot");
    } finally {
      setIsExpiring(false);
    }
  };
  
  // Show expire button if pot is expired but still active (timed out but not manually expired)
  const shouldShowExpireButton = pot.isExpired && pot.is_active;
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="overflow-hidden h-full flex flex-col transition-all hover:shadow-xl dark:hover:shadow-brand-green/20">
        <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 bg-slate-100 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={pot.creatorAvatar} alt={pot.creatorUsername} />
              <AvatarFallback>{pot.creatorUsername.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-display">{pot.title}</CardTitle>
              <p className="text-sm text-muted-foreground">by {pot.creatorUsername}</p>
            </div>
          </div>
          {isHot && !pot.isExpired && (
            <Badge variant="destructive" className="animate-pulse">Hot 🔥</Badge>
          )}
          {pot.isExpired && (
            <Badge variant="outline">Expired</Badge>
          )}
        </CardHeader>
        <CardContent className="p-6 flex-grow space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand-green" />
              <div>
                <p className="text-muted-foreground">Total Value</p>
                <p className="font-bold text-lg">${pot.totalValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-brand-gold" />
              <div>
                <p className="text-muted-foreground">Reward</p>
                <p className="font-bold text-lg">${pot.potentialReward.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Time Left</p>
                <p className={cn("font-semibold", pot.isExpired && "text-red-500")}>{pot.timeLeft}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Difficulty</p>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < pot.difficulty ? 'bg-brand-gold' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Attempts</p>
                <p className="font-bold text-lg">{parseInt(pot.attempts_count).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 bg-slate-50 dark:bg-slate-900/50">
          {shouldShowExpireButton ? (
            <div className="w-full space-y-2">
              <Button 
                onClick={handleExpirePot}
                disabled={isExpiring}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold"
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
              <p className="text-xs text-center text-muted-foreground">
                This pot has timed out but is still active. Click to manually expire it.
              </p>
            </div>
          ) : pot.isExpired ? (
            <div className="w-full bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold py-3 px-4 rounded-lg text-center cursor-not-allowed">
              Expired
            </div>
          ) : (
            <Button asChild className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold">
              <Link to={`/pots/${pot.id}`}>
                Attempt for ${pot.entryFee.toLocaleString()}
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
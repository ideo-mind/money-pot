import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { aptos } from "@/lib/aptos";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins } from "lucide-react";
export function UserBalance() {
  const { account, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchBalance = async () => {
      if (account?.address) {
        setLoading(true);
        try {
          const resources = await aptos.getAccountResources({ accountAddress: account.address });
          const aptosCoinResource = resources.find(
            (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
          );
          if (aptosCoinResource) {
            const coinAmount = (aptosCoinResource.data as any).coin.value;
            setBalance(coinAmount / 10 ** 8); // APT has 8 decimals
          }
        } catch (error) {
          console.error("Failed to fetch balance:", error);
          setBalance(null);
        } finally {
          setLoading(false);
        }
      }
    };
    if (connected) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [account, connected]);
  if (!connected) {
    return null;
  }
  if (loading) {
    return <Skeleton className="h-8 w-24 rounded-md" />;
  }
  if (balance !== null) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">
        <Coins className="w-4 h-4 text-brand-gold" />
        <span>{balance.toFixed(4)} APT</span>
      </div>
    );
  }
  return null;
}
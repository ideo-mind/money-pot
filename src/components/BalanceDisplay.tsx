import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { aptos } from "@/lib/aptos";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from "@/abis";

interface BalanceInfo {
  aptos: number | null;
  usdc: number | null;
  loading: boolean;
}

export function BalanceDisplay() {
  const { account, connected } = useWallet();
  const [balances, setBalances] = useState<BalanceInfo>({
    aptos: null,
    usdc: null,
    loading: false
  });

  useEffect(() => {
    const fetchBalances = async () => {
      if (account?.address) {
        console.log("Fetching balances for address:", account.address.toString());
        setBalances(prev => ({ ...prev, loading: true }));
        try {
          const resources = await aptos.getAccountResources({ accountAddress: account.address });
          console.log("Account resources:", resources);
          
          // Get APTOS balance using the SDK's built-in function
          let aptosBalance = 0;
          try {
            const aptosBalanceResult = await aptos.getAccountAPTAmount({ accountAddress: account.address });
            console.log("APTOS balance result:", aptosBalanceResult);
            aptosBalance = aptosBalanceResult / 10 ** 8; // Convert from octas to APT
            console.log("APTOS balance calculated:", aptosBalance);
          } catch (error) {
            console.error("Failed to fetch APTOS balance with SDK, trying resource method:", error);
            
            // Fallback to resource method
            const aptosCoinResource = resources.find(
              (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
            );
            console.log("APTOS coin resource:", aptosCoinResource);
            
            if (aptosCoinResource && aptosCoinResource.data) {
              const coinValue = (aptosCoinResource.data as any).coin?.value;
              console.log("APTOS coin value:", coinValue);
              if (typeof coinValue === 'number' || typeof coinValue === 'string') {
                aptosBalance = Number(coinValue) / 10 ** 8;
                console.log("APTOS balance calculated (fallback):", aptosBalance);
              }
            }
          }

          // Get USDC balance using the contract's getBalance function
          let usdcBalance = 0;
          try {
            const balanceResult = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getBalance(aptos, {
              functionArguments: [account.address.toString()]
            });
            console.log("USDC balance result:", balanceResult);
            // getBalance returns an array like [BigInt(1000000)]
            const balanceBigInt = balanceResult[0];
            usdcBalance = Number(balanceBigInt) / 10 ** 6; // USDC has 6 decimals
            console.log("USDC balance calculated:", usdcBalance);
          } catch (error) {
            console.error("Failed to fetch USDC balance:", error);
          }

          console.log("Final balances:", { aptos: aptosBalance, usdc: usdcBalance });
          setBalances({
            aptos: aptosBalance,
            usdc: usdcBalance,
            loading: false
          });
        } catch (error) {
          console.error("Failed to fetch balances:", error);
          setBalances({
            aptos: null,
            usdc: null,
            loading: false
          });
        }
      }
    };

    if (connected) {
      fetchBalances();
    } else {
      setBalances({
        aptos: null,
        usdc: null,
        loading: false
      });
    }
  }, [account, connected]);

  if (!connected) {
    return null;
  }

  if (balances.loading) {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    );
  }

  const needsAptos = balances.aptos !== null && balances.aptos < 1;
  const needsUsdc = balances.usdc !== null && balances.usdc < 1;

  return (
    <div className="flex items-center gap-2">
      {/* Compact Balance Display */}
      <div className="flex items-center gap-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
        <Coins className="w-3 h-3 text-brand-gold" />
        <span>{typeof balances.aptos === 'number' ? balances.aptos.toFixed(2) : '0.00'} APT</span>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
        <Coins className="w-3 h-3 text-blue-500" />
        <span>{typeof balances.usdc === 'number' ? balances.usdc.toFixed(2) : '0.00'} USDC</span>
      </div>

      {/* Compact Faucet Alerts */}
      {(needsAptos || needsUsdc) && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-orange-500" />
          <div className="flex gap-1">
            {needsAptos && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://aptos.dev/network/faucet?address=${account?.address?.toString()}`, '_blank')}
                className="text-xs h-6 px-2 border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-900"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                APT
              </Button>
            )}
            {needsUsdc && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://faucet.circle.com', '_blank')}
                className="text-xs h-6 px-2 border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-900"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                USDC
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

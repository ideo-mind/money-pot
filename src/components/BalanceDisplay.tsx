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
        setBalances(prev => ({ ...prev, loading: true }));
        try {
          const resources = await aptos.getAccountResources({ accountAddress: account.address });
          
          // Get APTOS balance
          const aptosCoinResource = resources.find(
            (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
          );
          let aptosBalance = 0;
          if (aptosCoinResource && aptosCoinResource.data) {
            const coinValue = (aptosCoinResource.data as any).coin?.value;
            if (typeof coinValue === 'number' || typeof coinValue === 'string') {
              aptosBalance = Number(coinValue) / 10 ** 8;
            }
          }

          // Get USDC token address from contract
          let usdcBalance = 0;
          try {
            const tokenResult = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getToken(aptos);
            // getToken returns an array like ["0x69091fbab5f7d635ee7ac5098cf0c1efbe31d68fec0f2cd565e8d168daf52832"]
            const usdcTokenAddress = tokenResult[0];
            
            // Ensure we have a valid address string
            if (typeof usdcTokenAddress === 'string' && usdcTokenAddress.startsWith('0x')) {
              // Find USDC coin store resource
              const usdcCoinResource = resources.find(
                (r) => r.type === `0x1::coin::CoinStore<${usdcTokenAddress}>`
              );
              
              if (usdcCoinResource && usdcCoinResource.data) {
                const coinValue = (usdcCoinResource.data as any).coin?.value;
                if (typeof coinValue === 'number' || typeof coinValue === 'string') {
                  usdcBalance = Number(coinValue) / 10 ** 6; // USDC has 6 decimals
                }
              }
            } else {
              console.warn("Invalid USDC token address received:", usdcTokenAddress);
            }
          } catch (error) {
            console.error("Failed to fetch USDC balance:", error);
          }

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
    <div className="space-y-3">
      {/* Balance Display */}
      <div className="flex gap-2">
        <div className="flex items-center gap-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">
          <Coins className="w-4 h-4 text-brand-gold" />
          <span>{typeof balances.aptos === 'number' ? balances.aptos.toFixed(4) : '0.0000'} APT</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">
          <Coins className="w-4 h-4 text-blue-500" />
          <span>{typeof balances.usdc === 'number' ? balances.usdc.toFixed(2) : '0.00'} USDC</span>
        </div>
      </div>

      {/* Faucet Alerts */}
      {(needsAptos || needsUsdc) && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              <p className="font-medium text-orange-800 dark:text-orange-200">
                Low balance detected! Get testnet tokens:
              </p>
              <div className="space-y-3">
                {needsAptos && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://aptos.dev/network/faucet?address=${account?.address?.toString()}`, '_blank')}
                        className="text-xs border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-900"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Get APTOS
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Address:</span>
                      <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-mono">
                        {account?.address?.toString()}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(account?.address?.toString() || '');
                          // You could add a toast notification here if you have one
                        }}
                        className="h-6 w-6 p-0 hover:bg-orange-100 dark:hover:bg-orange-900"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}
                {needsUsdc && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://faucet.circle.com', '_blank')}
                      className="text-xs border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-900"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Get USDC (Aptos Testnet)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

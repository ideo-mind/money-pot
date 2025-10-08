import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Copy, Coins, AlertTriangle, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { aptos } from "@/lib/aptos";
import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from "@/abis";
import { Network } from "@aptos-labs/ts-sdk";
interface WalletBalances {
  aptos: number | null;
  usdc: number | null;
  loading: boolean;
}

export function WalletConnectButton() {
  const { connect, disconnect, account, wallets, connected, isLoading, network, changeNetwork } = useWallet();
  const [balances, setBalances] = useState<WalletBalances>({
    aptos: null,
    usdc: null,
    loading: false
  });
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Check if wallet is on the correct network (testnet)
  useEffect(() => {
    if (network) {
      const isTestnet = network.name?.toLowerCase().includes('testnet') || 
                       network.name?.toLowerCase().includes('test') ||
                       network.chainId === '2'; // Aptos testnet chain ID
      setIsWrongNetwork(!isTestnet);
    }
  }, [network]);

  // Fetch balances when connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (account?.address && connected) {
        setBalances(prev => ({ ...prev, loading: true }));
        try {
          // Get APTOS balance
          let aptosBalance = 0;
          try {
            const aptosBalanceResult = await aptos.getAccountAPTAmount({ accountAddress: account.address });
            aptosBalance = aptosBalanceResult / 10 ** 8;
          } catch (error) {
            console.error("Failed to fetch APTOS balance:", error);
          }

          // Get USDC balance
          let usdcBalance = 0;
          try {
            const balanceResult = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getBalance(aptos, {
              functionArguments: [account.address.toString()]
            });
            const balanceBigInt = balanceResult[0];
            usdcBalance = Number(balanceBigInt) / 10 ** 6;
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

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString());
      // You could add a toast notification here
    }
  };

  const switchToTestnet = async () => {
    if (changeNetwork) {
      try {
        await changeNetwork(Network.TESTNET);
      } catch (error) {
        console.error("Failed to switch network:", error);
      }
    }
  };
  if (connected && account) {
    return (
      <div className="flex flex-col gap-2">
        {/* Network Warning */}
        {isWrongNetwork && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Wrong network! Please switch to Aptos Testnet
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={switchToTestnet}
              className="ml-auto h-6 px-2 text-xs"
            >
              Switch
            </Button>
          </div>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {/* FIX: Convert AccountAddress to string before formatting */}
              <span>{formatAddress(account.address.toString())}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
          {/* Address Section */}
          <DropdownMenuLabel className="px-3 py-2">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Wallet Address</div>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-1 break-all">
                  {account.address.toString()}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAddress}
                  className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Network Section */}
          <DropdownMenuLabel className="px-3 py-2">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Network</div>
              <div className="flex items-center gap-2">
                <Wifi className={`w-3 h-3 ${isWrongNetwork ? 'text-red-500' : 'text-green-500'}`} />
                <span className={`text-xs ${isWrongNetwork ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {network?.name || 'Unknown Network'}
                </span>
                {isWrongNetwork && (
                  <span className="text-xs text-red-500">(Wrong Network)</span>
                )}
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Balance Section */}
          <DropdownMenuLabel className="px-3 py-2">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Balances</div>
              {balances.loading ? (
                <div className="text-xs text-muted-foreground">Loading balances...</div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Coins className="w-3 h-3 text-brand-gold" />
                    <span>APT: {typeof balances.aptos === 'number' ? balances.aptos.toFixed(4) : '0.0000'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Coins className="w-3 h-3 text-blue-500" />
                    <span>USDC: {typeof balances.usdc === 'number' ? balances.usdc.toFixed(2) : '0.00'}</span>
                  </div>
                </div>
              )}
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Disconnect Button */}
          <DropdownMenuItem onClick={() => disconnect()} className="flex items-center gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isLoading} className="bg-brand-green hover:bg-brand-green/90 text-white">
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {wallets.map((wallet) => (
          <DropdownMenuItem
            key={wallet.name}
            onClick={() => connect(wallet.name)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src={wallet.icon} alt={wallet.name} className="w-5 h-5" />
            <span>{wallet.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
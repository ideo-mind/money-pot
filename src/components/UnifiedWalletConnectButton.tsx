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
import { ChevronDown, LogOut, Copy, Coins, AlertTriangle, Wifi, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { aptos } from "@/lib/aptos";
import { _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f } from "@/abis";
import { Network } from "@aptos-labs/ts-sdk";
import { useUnifiedWallet } from "./UnifiedWalletProvider";
import { publicClient, formatEVMAddress, formatCTC } from "@/config/viem";
import { getConnectedWallet } from "@/lib/web3onboard";
import { evmContractService } from "@/lib/evm-api";

interface WalletBalances {
  aptos: number | null;
  usdc: number | null;
  ctc: number | null;
  loading: boolean;
}

export function UnifiedWalletConnectButton() {
  const { connect, disconnect, account, wallets, connected, isLoading, network, changeNetwork } = useWallet();
  const { walletState, connectEVM, disconnect: disconnectUnified, switchToAptos, switchToEVM } = useUnifiedWallet();
  const [balances, setBalances] = useState<WalletBalances>({
    aptos: null,
    usdc: null,
    ctc: null,
    loading: false
  });
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Check if wallet is on the correct network
  useEffect(() => {
    if (walletState.type === 'aptos' && network) {
      const isTestnet = network.name?.toLowerCase().includes('testnet') || 
                       network.name?.toLowerCase().includes('test') ||
                       network.chainId === '2'; // Aptos testnet chain ID
      setIsWrongNetwork(!isTestnet);
    } else if (walletState.type === 'evm') {
      const evmWallet = getConnectedWallet();
      const isCorrectNetwork = evmWallet?.chains?.[0]?.id === '0x18e7f'; // Creditcoin testnet chain ID in hex
      setIsWrongNetwork(!isCorrectNetwork);
    }
  }, [network, walletState.type]);

  // Fetch balances when connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (walletState.isConnected && walletState.address) {
        setBalances(prev => ({ ...prev, loading: true }));
        try {
          if (walletState.type === 'aptos') {
            // Get APTOS balance
            let aptosBalance = 0;
            try {
              const aptosBalanceResult = await aptos.getAccountAPTAmount({ accountAddress: walletState.address });
              aptosBalance = aptosBalanceResult / 10 ** 8;
            } catch (error) {
              console.error("Failed to fetch APTOS balance:", error);
            }

            // Get USDC balance
            let usdcBalance = 0;
            try {
              const balanceResult = await _0xea89ef9798a210009339ea6105c2008d8e154f8b5ae1807911c86320ea03ff3f.money_pot_manager.view.getBalance(aptos, {
                functionArguments: [walletState.address.toString()]
              });
              const balanceBigInt = balanceResult[0];
              usdcBalance = Number(balanceBigInt) / 10 ** 6;
            } catch (error) {
              console.error("Failed to fetch USDC balance:", error);
            }

            setBalances({
              aptos: aptosBalance,
              usdc: usdcBalance,
              ctc: null,
              loading: false
            });
          } else if (walletState.type === 'evm') {
            // Get CTC balance
            let ctcBalance = 0;
            try {
              const balance = await publicClient.getBalance({
                address: walletState.address as `0x${string}`,
              });
              ctcBalance = formatCTC(balance);
            } catch (error) {
              console.error("Failed to fetch CTC balance:", error);
            }

            // Get USDC balance from contract
            let usdcBalance = 0;
            try {
              usdcBalance = await evmContractService.getBalance(walletState.address as `0x${string}`);
            } catch (error) {
              console.error("Failed to fetch USDC balance:", error);
            }

            setBalances({
              aptos: null,
              usdc: usdcBalance,
              ctc: ctcBalance,
              loading: false
            });
          }
        } catch (error) {
          console.error("Failed to fetch balances:", error);
          setBalances({
            aptos: null,
            usdc: null,
            ctc: null,
            loading: false
          });
        }
      } else {
        setBalances({
          aptos: null,
          usdc: null,
          ctc: null,
          loading: false
        });
      }
    };

    if (walletState.isConnected) {
      fetchBalances();
    } else {
      setBalances({
        aptos: null,
        usdc: null,
        ctc: null,
        loading: false
      });
    }
  }, [walletState.address, walletState.isConnected, walletState.type]);

  const copyAddress = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
    }
  };

  const switchToTestnet = async () => {
    if (walletState.type === 'aptos' && changeNetwork) {
      try {
        await changeNetwork(Network.TESTNET);
      } catch (error) {
        console.error("Failed to switch network:", error);
      }
    }
    // For EVM, network switching is handled by Web3Onboard
  };

  const handleDisconnect = async () => {
    if (walletState.type === 'aptos') {
      await disconnect();
    } else if (walletState.type === 'evm') {
      await disconnectUnified();
    }
  };

  if (walletState.isConnected && walletState.address) {
    return (
      <div className="flex flex-col gap-2">
        {/* Network Warning */}
        {isWrongNetwork && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              Wrong network! Please switch to {walletState.type === 'aptos' ? 'Aptos' : 'Creditcoin'} Testnet
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
              <Wallet className="w-4 h-4" />
              <span>{formatAddress(walletState.address)}</span>
              <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                {walletState.type?.toUpperCase()}
              </span>
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
                  {walletState.address}
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
                  {walletState.type === 'aptos' ? (network?.name || 'Aptos Testnet') : 'Creditcoin Testnet'}
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
                  {walletState.type === 'aptos' && (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <Coins className="w-3 h-3 text-brand-gold" />
                        <span>APT: {typeof balances.aptos === 'number' ? balances.aptos.toFixed(4) : '0.0000'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Coins className="w-3 h-3 text-blue-500" />
                        <span>USDC: {typeof balances.usdc === 'number' ? balances.usdc.toFixed(2) : '0.00'}</span>
                      </div>
                    </>
                  )}
                  {walletState.type === 'evm' && (
                    <>
                      <div className="flex items-center gap-2 text-xs">
                        <Coins className="w-3 h-3 text-purple-500" />
                        <span>CTC: {typeof balances.ctc === 'number' ? balances.ctc.toFixed(4) : '0.0000'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Coins className="w-3 h-3 text-blue-500" />
                        <span>USDC: {typeof balances.usdc === 'number' ? balances.usdc.toFixed(2) : '0.00'}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Switch Wallet Type */}
          <DropdownMenuItem onClick={() => walletState.type === 'aptos' ? switchToEVM() : switchToAptos()} className="flex items-center gap-2 cursor-pointer">
            <Wallet className="w-4 h-4" />
            <span>Switch to {walletState.type === 'aptos' ? 'EVM' : 'Aptos'}</span>
          </DropdownMenuItem>
          
          {/* Disconnect Button */}
          <DropdownMenuItem onClick={handleDisconnect} className="flex items-center gap-2 cursor-pointer">
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
        <Button disabled={isLoading || walletState.isLoading} className="bg-brand-green hover:bg-brand-green/90 text-white">
          {isLoading || walletState.isLoading ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Aptos Wallets */}
        <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
          Aptos Wallets
        </DropdownMenuLabel>
        {wallets.map((wallet) => (
          <DropdownMenuItem
            key={`aptos-${wallet.name}`}
            onClick={() => connect(wallet.name)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src={wallet.icon} alt={wallet.name} className="w-5 h-5" />
            <span>{wallet.name}</span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* EVM Wallets */}
        <DropdownMenuLabel className="px-3 py-2 text-xs text-muted-foreground">
          EVM Wallets
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={connectEVM}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Wallet className="w-5 h-5" />
          <span>Connect EVM Wallet</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

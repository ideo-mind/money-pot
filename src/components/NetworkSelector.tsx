import React from 'react';
import { useUnifiedWallet } from '@/components/UnifiedWalletProvider';
import { NETWORKS, WalletType } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Network, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NetworkSelector() {
  const { walletState, connectWallet, disconnectWallet } = useUnifiedWallet();

  const getCurrentNetwork = () => {
    if (!walletState?.type) return null;
    return walletState.type === 'evm' ? NETWORKS.CREDITCOIN : NETWORKS.APTOS;
  };

  const handleNetworkSwitch = async (networkType: WalletType) => {
    if (walletState?.type === networkType) return;

    // Disconnect current wallet if connected
    if (walletState?.type) {
      await disconnectWallet();
    }

    // Connect to new network
    await connectWallet(networkType);
  };

  const currentNetwork = getCurrentNetwork();

  if (!walletState?.type) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Network className="w-5 h-5" />
            Select Network
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => handleNetworkSwitch('aptos')}
              variant="outline"
              className="w-full justify-start"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div className="text-left">
                  <div className="font-medium">{NETWORKS.APTOS.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Chain ID: {NETWORKS.APTOS.chainId}
                  </div>
                </div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleNetworkSwitch('evm')}
              variant="outline"
              className="w-full justify-start"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
                <div className="text-left">
                  <div className="font-medium">{NETWORKS.CREDITCOIN.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Chain ID: {NETWORKS.CREDITCOIN.chainId}
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={walletState.type === 'evm' ? 'default' : 'secondary'}
        className="flex items-center gap-1"
      >
        <div className={`w-2 h-2 rounded-full ${
          walletState.type === 'evm' ? 'bg-purple-500' : 'bg-blue-500'
        }`} />
        {currentNetwork?.name}
      </Badge>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => handleNetworkSwitch('aptos')}
            className="flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div>
              <div className="font-medium">{NETWORKS.APTOS.name}</div>
              <div className="text-xs text-muted-foreground">
                Chain ID: {NETWORKS.APTOS.chainId}
              </div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleNetworkSwitch('evm')}
            className="flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <div>
              <div className="font-medium">{NETWORKS.CREDITCOIN.name}</div>
              <div className="text-xs text-muted-foreground">
                Chain ID: {NETWORKS.CREDITCOIN.chainId}
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

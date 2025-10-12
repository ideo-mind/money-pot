import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Coins, CheckCircle, XCircle } from 'lucide-react';
import { useUnifiedWallet } from '@/components/UnifiedWalletProvider';
import { evmFaucetService } from '@/lib/evm-faucet';
import { toast } from 'sonner';

export function FaucetPage() {
  const { walletState } = useUnifiedWallet();
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleAirdropRequest = async () => {
    if (!walletState?.type) {
      toast.error('Please connect a wallet first');
      return;
    }

    if (walletState.type !== 'evm') {
      toast.error('Airdrop is only available for EVM wallets');
      return;
    }

    setIsRequesting(true);
    setLastResult(null);

    try {
      const result = await evmFaucetService.requestAirdrop({
        amount: 200,
        message: "Claim airdrop"
      });

      setLastResult(result);

      if (result.success) {
        toast.success('Airdrop successful!', {
          description: `Received ${result.message || '200 CTC + USDC'}`
        });
      } else {
        toast.error('Airdrop failed', {
          description: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastResult({ success: false, error: errorMessage });
      toast.error('Airdrop request failed', {
        description: errorMessage
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const airdropInfo = evmFaucetService.getAirdropInfo();

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-display font-bold">Faucet</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          Get test tokens for Creditcoin EVM testnet
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Creditcoin Testnet Faucet
          </CardTitle>
          <CardDescription>
            Request test tokens to participate in Money Pot games
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Network Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <h3 className="font-medium">Network Status</h3>
              <p className="text-sm text-muted-foreground">
                {airdropInfo.available ? 'Available' : 'Not Available'}
              </p>
            </div>
            <Badge variant={airdropInfo.available ? 'default' : 'secondary'}>
              {airdropInfo.network}
            </Badge>
          </div>

          {/* Airdrop Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Amount</h4>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {airdropInfo.amount}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Tokens</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100">Tokens</h4>
              <div className="flex gap-1">
                {airdropInfo.tokens.map((token) => (
                  <Badge key={token} variant="secondary" className="text-xs">
                    {token}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Wallet Status */}
          {!walletState?.type ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                Please connect an EVM wallet to request airdrop
              </p>
            </div>
          ) : walletState.type !== 'evm' ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">
                Airdrop is only available for EVM wallets. Please switch to Creditcoin network.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-200 text-sm">
                ✅ EVM wallet connected. Ready to request airdrop.
              </p>
            </div>
          )}

          {/* Request Button */}
          <Button
            onClick={handleAirdropRequest}
            disabled={!airdropInfo.available || !walletState?.type || walletState.type !== 'evm' || isRequesting}
            className="w-full"
            size="lg"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Requesting Airdrop...
              </>
            ) : (
              <>
                <Coins className="w-4 h-4 mr-2" />
                Request Airdrop
              </>
            )}
          </Button>

          {/* Last Result */}
          {lastResult && (
            <div className={`p-4 rounded-lg border ${
              lastResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {lastResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <h4 className={`font-medium ${
                  lastResult.success 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {lastResult.success ? 'Airdrop Successful' : 'Airdrop Failed'}
                </h4>
              </div>
              <p className={`text-sm mt-1 ${
                lastResult.success 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {lastResult.success ? lastResult.message : lastResult.error}
              </p>
              {lastResult.transactionHash && (
                <p className="text-xs text-muted-foreground mt-2">
                  Transaction: {lastResult.transactionHash}
                </p>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h4 className="font-medium mb-2">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Connect an EVM wallet (MetaMask, WalletConnect, etc.)</li>
              <li>2. Switch to Creditcoin Testnet</li>
              <li>3. Click "Request Airdrop" to get test tokens</li>
              <li>4. Use the tokens to participate in Money Pot games</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

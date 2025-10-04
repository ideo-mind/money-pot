import React, { useState } from 'react';
import { useTransactionStore } from '@/store/transaction-store';
import { Transaction } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, X, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const getStatusIcon = (status: Transaction['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusColor = (status: Transaction['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'success':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getTypeLabel = (type: Transaction['type']) => {
  switch (type) {
    case 'create_pot':
      return 'Create Pot';
    case 'attempt_pot':
      return 'Attempt Pot';
    case 'expire_pot':
      return 'Expire Pot';
    default:
      return type;
  }
};

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex-shrink-0 mt-0.5">
        {getStatusIcon(transaction.status)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {transaction.description}
          </span>
          <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{getTypeLabel(transaction.type)}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })}</span>
          {transaction.potId && (
            <>
              <span>•</span>
              <span>Pot #{transaction.potId}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Details
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => window.open(`https://explorer.aptoslabs.com/txn/${transaction.hash}`, '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View on Explorer
          </Button>
        </div>
        
        {isExpanded && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Hash:</span>
                <code className="ml-2 text-slate-600 dark:text-slate-400 font-mono">
                  {transaction.hash.slice(0, 8)}...{transaction.hash.slice(-8)}
                </code>
              </div>
              {transaction.amount && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Amount:</span>
                  <span className="ml-2 text-slate-600 dark:text-slate-400">
                    {transaction.amount} USDC
                  </span>
                </div>
              )}
              {transaction.error && (
                <div>
                  <span className="font-medium text-red-700 dark:text-red-300">Error:</span>
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    {transaction.error}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TransactionLog: React.FC = () => {
  const { transactions, clearTransactions } = useTransactionStore();
  const [isOpen, setIsOpen] = useState(false);
  
  const pendingTransactions = transactions.filter(tx => tx.status === 'pending');
  const recentTransactions = transactions.slice(0, 10);
  
  if (transactions.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-12 flex items-center justify-between px-4 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Transaction Log
                </span>
              </div>
              
              {pendingTransactions.length > 0 && (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {pendingTransactions.length} pending
                </Badge>
              )}
              
              <Badge variant="secondary">
                {transactions.length} total
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {transactions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearTransactions();
                  }}
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="max-h-96 border-t border-slate-200 dark:border-slate-700">
            <ScrollArea className="h-96">
              <div className="p-4 space-y-3">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No transactions yet
                  </div>
                ) : (
                  recentTransactions.map((transaction) => (
                    <TransactionItem key={transaction.id} transaction={transaction} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

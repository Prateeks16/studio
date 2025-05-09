
'use client';

import type { Wallet, Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { WalletIcon, PlusCircle, Loader2, ArrowDownCircle, ArrowUpCircle, CircleSlash, Info, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';


type SidebarWalletWidgetProps = {
  wallet: Wallet | null | undefined;
  isLoadingWallet: boolean;
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  onAddFundsClick: () => void;
};

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'add_funds':
      return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
    case 'charge_success':
      return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
    case 'charge_failed':
      return <CircleSlash className="h-4 w-4 text-orange-500" />;
    case 'status_change':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
};

const getTransactionBadgeVariant = (type: Transaction['type']): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case 'add_funds':
      return 'default'; 
    case 'charge_success':
      return 'destructive';
    case 'charge_failed':
      return 'secondary'; 
    case 'status_change':
      return 'outline'; 
    default:
      return 'secondary';
  }
};


export default function SidebarWalletWidget({ wallet, isLoadingWallet, transactions, isLoadingTransactions, onAddFundsClick }: SidebarWalletWidgetProps) {
  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-2 group-data-[collapsible=icon]:p-1 border-t border-sidebar-border mt-auto flex flex-col">
      {/* Wallet Balance and Add Funds Button */}
      <div className="mb-2">
        <div className={cn(
            "flex items-center justify-between p-2 rounded-md group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:space-y-1",
            "bg-sidebar-accent/10 text-sidebar-foreground"
            )}>
          <div className="flex items-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
            <WalletIcon className="h-5 w-5 mr-2 text-sidebar-primary group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:mb-0.5" />
            <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Wallet</span>
          </div>
          {isLoadingWallet ? (
            <Loader2 className="h-4 w-4 animate-spin text-sidebar-primary group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
          ) : (
            <span className="text-sm font-semibold text-sidebar-primary group-data-[collapsible=icon]:text-xs">
              {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start mt-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mt-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
          onClick={onAddFundsClick}
        >
          <PlusCircle className="h-5 w-5" />
          <span className="ml-2 group-data-[collapsible=icon]:hidden">Add Funds</span>
        </Button>
      </div>

      {/* Transaction History - only visible when sidebar is expanded */}
      <div className="group-data-[collapsible=icon]:hidden mt-2 flex-grow flex flex-col min-h-0">
        <Separator className="my-2 bg-sidebar-border" />
        <div className="flex items-center mb-2 px-1">
          <History className="h-4 w-4 mr-2 text-sidebar-primary" />
          <h4 className="text-xs font-semibold text-sidebar-foreground">Recent Activity</h4>
        </div>
        {isLoadingTransactions ? (
            <div className="flex justify-center items-center h-[150px]">
                 <Loader2 className="h-6 w-6 animate-spin text-sidebar-primary" />
            </div>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-sidebar-foreground/70 text-center py-4 px-1">No transactions yet.</p>
        ) : (
          <ScrollArea className="h-[150px] w-full pr-1"> {/* Adjust height as needed */}
            <ul className="space-y-2">
              {transactions.slice(0, 10).map((txn) => ( // Display latest 10 transactions for brevity in sidebar
                <li key={txn.id} className="flex items-start justify-between p-1.5 bg-background/50 rounded-md text-xs">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5">{getTransactionIcon(txn.type)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground leading-tight">{txn.description}</p>
                      <p className="text-muted-foreground leading-tight text-[0.7rem]">{formatDate(txn.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-1">
                    {txn.amount !== undefined && (
                      <p className={`font-semibold leading-tight ${txn.type === 'add_funds' ? 'text-green-600' : (txn.type === 'charge_success' ? 'text-red-600' : 'text-foreground')}`}>
                        {txn.type === 'add_funds' ? '+' : (txn.type === 'charge_success' ? '-' : '')}{formatCurrency(txn.amount)}
                      </p>
                    )}
                     <Badge variant={getTransactionBadgeVariant(txn.type)} className="mt-0.5 capitalize text-[0.65rem] px-1.5 py-0 leading-tight">
                        {txn.type.replace('_', ' ')}
                     </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
         {transactions.length > 10 && (
            <p className="text-xs text-sidebar-foreground/70 text-center pt-1">Showing latest 10 of {transactions.length} transactions.</p>
        )}
      </div>
    </div>
  );
}

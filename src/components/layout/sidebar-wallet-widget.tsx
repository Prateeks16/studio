
'use client';

import type { Wallet } from '@/types';
import { Button } from '@/components/ui/button';
import { WalletIcon, PlusCircle, Loader2 } from 'lucide-react'; // Renamed Wallet to WalletIcon to avoid conflict
import { cn } from '@/lib/utils';

type SidebarWalletWidgetProps = {
  wallet: Wallet | null | undefined;
  isLoading: boolean;
  onAddFundsClick: () => void;
};

export default function SidebarWalletWidget({ wallet, isLoading, onAddFundsClick }: SidebarWalletWidgetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="p-2 group-data-[collapsible=icon]:p-1 border-t border-sidebar-border mt-auto">
      <div className={cn(
          "flex items-center justify-between p-2 rounded-md group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:space-y-1",
          "bg-sidebar-accent/10 text-sidebar-foreground" // Adjusted background for better contrast within sidebar
          )}>
        <div className="flex items-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
          <WalletIcon className="h-5 w-5 mr-2 text-sidebar-primary group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:mb-0.5" />
          <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Wallet</span>
        </div>
        {isLoading ? (
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
        // Size is implicitly handled by group-data for icon display.
        // No need for explicit size prop changing based on state here.
      >
        <PlusCircle className="h-5 w-5" />
        <span className="ml-2 group-data-[collapsible=icon]:hidden">Add Funds</span>
      </Button>
    </div>
  );
}


'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import SidebarNav from './sidebar-nav';
// SidebarWalletWidget and SidebarAiSuggestionWidget are removed
import { CircleDollarSign, LogOut, Settings, PlusCircle, Wallet as WalletIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Wallet, Transaction } from '@/types';
import { getWallet as getWalletService, addFunds as addFundsService, getTransactions as getTransactionsService } from '@/services/walletService';
import AddFundsModal from '@/components/dashboard/add-funds-modal';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils'; // For conditional class names

const MOCK_USER_ID = 'defaultUser'; 

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const router = useRouter(); 
  const { toast } = useToast();

  // Wallet and transaction state remains in AppLayout for AddFundsModal
  const [wallet, setWallet] = React.useState<Wallet | null>(null);
  const [isWalletLoading, setIsWalletLoading] = React.useState(true);
  // Transactions are fetched but not directly passed down as a widget anymore
  // const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  // const [isTransactionsLoading, setIsTransactionsLoading] = React.useState(true);
  
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = React.useState(false);
  const [isAddingFunds, setIsAddingFunds] = React.useState(false);

  const fetchWalletData = React.useCallback(async () => {
    setIsWalletLoading(true);
    try {
      const fetchedWallet = await getWalletService(MOCK_USER_ID);
      setWallet(fetchedWallet || { userId: MOCK_USER_ID, balance: 0 });
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to retrieve wallet data.";
      toast({ title: 'Error fetching wallet data', description: errorMessage, variant: 'destructive' });
      setWallet({ userId: MOCK_USER_ID, balance: 0 }); 
    } finally {
      setIsWalletLoading(false);
    }
  }, [toast]);

  // Fetch transactions primarily for the modal to refresh global state; pages will fetch their own display data
  const fetchTransactionDataForModalRefresh = React.useCallback(async () => {
    try {
      // This function is called after adding funds to ensure any dependent components update.
      // The actual display of transactions is handled by the /wallet page now.
      await getTransactionsService(MOCK_USER_ID); 
    } catch (e: any) {
      // Silently fail or log, as the primary display is elsewhere
      console.error("Error refreshing transactions for modal context:", e);
    }
  }, []);


  React.useEffect(() => {
    fetchWalletData();
    // No need to fetch all transactions here for display, only for potential refresh context
    // fetchTransactionDataForModalRefresh(); 
  }, [fetchWalletData]);

  const onAddFundsSubmit = async (amount: number) => {
    setIsAddingFunds(true);
    try {
      await addFundsService(MOCK_USER_ID, amount); 
      await fetchWalletData(); // Refresh wallet balance in AppLayout (e.g. for a potential header display)
      await fetchTransactionDataForModalRefresh(); // Signal that transactions updated (e.g. for /wallet page)
      
      // Dispatch a custom event to notify other components (like /wallet page) that transactions were updated
      window.dispatchEvent(new CustomEvent('payright-transactions-updated'));
      window.dispatchEvent(new CustomEvent('payright-wallet-updated'));


      toast({ title: 'Funds Added', description: `Successfully added $${amount.toFixed(2)} to your wallet.` });
      setIsAddFundsModalOpen(false);
    } catch (e: any)
{
      const errorMessage = e instanceof Error ? e.message : "Failed to add funds.";
      toast({ title: 'Error Adding Funds', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAddingFunds(false);
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };
  
  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };


  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r">
        <SidebarHeader className="p-4 justify-between flex items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
             <CircleDollarSign className="h-7 w-7 text-primary group-data-[collapsible=icon]:mx-auto" />
            <h1 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">
              PayRight
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex flex-col"> {/* Ensure content can grow and push footer down */}
          <SidebarNav />
          {/* SidebarWalletWidget and SidebarAiSuggestionWidget removed from here */}
          {/* Minimal Wallet Info and Add Funds directly in Sidebar Footer area or a small static component */}
          <div className="mt-auto p-2 group-data-[collapsible=icon]:p-1 border-t border-sidebar-border">
             <div className={cn(
                "flex items-center justify-between p-2 rounded-md group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:space-y-1",
                "bg-sidebar-accent/10 text-sidebar-foreground mb-2"
                )}>
              <div className="flex items-center group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
                <WalletIcon className="h-5 w-5 mr-2 text-sidebar-primary group-data-[collapsible=icon]:mr-0 group-data-[collapsible=icon]:mb-0.5" />
                <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Wallet</span>
              </div>
              {isWalletLoading ? (
                 <span className="text-sm text-sidebar-primary group-data-[collapsible=icon]:text-xs">...</span>
              ) : (
                <span className="text-sm font-semibold text-sidebar-primary group-data-[collapsible=icon]:text-xs">
                  {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              onClick={() => setIsAddFundsModalOpen(true)}
            >
              <PlusCircle className="h-5 w-5" />
              <span className="ml-2 group-data-[collapsible=icon]:hidden">Add Funds</span>
            </Button>
          </div>
        </SidebarContent>
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="ml-2 group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Breadcrumbs or page title can go here */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://picsum.photos/seed/avatar/40/40" alt="User Avatar" data-ai-hint="user avatar" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
      {isAddFundsModalOpen && (
        <AddFundsModal
          isOpen={isAddFundsModalOpen}
          onClose={() => setIsAddFundsModalOpen(false)}
          onAddFunds={onAddFundsSubmit}
          isLoading={isAddingFunds}
        />
      )}
    </SidebarProvider>
  );
}


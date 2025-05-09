
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
import SidebarWalletWidget from './sidebar-wallet-widget';
import SidebarAiSuggestionWidget from './sidebar-ai-suggestion-widget'; 
import { CircleDollarSign, LogOut, Settings } from 'lucide-react';
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

const MOCK_USER_ID = 'defaultUser'; 

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const router = useRouter(); 
  const { toast } = useToast();

  const [wallet, setWallet] = React.useState<Wallet | null>(null);
  const [isWalletLoading, setIsWalletLoading] = React.useState(true);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = React.useState(true);
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

  const fetchTransactionData = React.useCallback(async () => {
    setIsTransactionsLoading(true);
    try {
      const fetchedTransactions = await getTransactionsService(MOCK_USER_ID);
      setTransactions(fetchedTransactions || []);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to retrieve transaction data.";
      toast({ title: 'Error fetching transactions', description: errorMessage, variant: 'destructive' });
      setTransactions([]);
    } finally {
      setIsTransactionsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchWalletData();
    fetchTransactionData();
  }, [fetchWalletData, fetchTransactionData]);

  const onAddFundsSubmit = async (amount: number) => {
    setIsAddingFunds(true);
    try {
      await addFundsService(MOCK_USER_ID, amount); 
      await fetchWalletData(); 
      await fetchTransactionData(); // Refresh transactions after adding funds
      toast({ title: 'Funds Added', description: `Successfully added $${amount.toFixed(2)} to your wallet.` });
      setIsAddFundsModalOpen(false);
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "Failed to add funds.";
      toast({ title: 'Error Adding Funds', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAddingFunds(false);
    }
  };

  const handleLogout = () => {
    router.push('/login');
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
        <SidebarContent>
          <SidebarNav />
          <SidebarWalletWidget 
            wallet={wallet} 
            isLoadingWallet={isWalletLoading} 
            transactions={transactions}
            isLoadingTransactions={isTransactionsLoading}
            onAddFundsClick={() => setIsAddFundsModalOpen(true)} 
          />
          <SidebarAiSuggestionWidget /> 
        </SidebarContent>
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
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


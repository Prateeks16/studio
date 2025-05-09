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
import { CircleDollarSign, UserCircle, LogOut, Settings } from 'lucide-react';
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
import type { Wallet } from '@/types';
import { handleGetWalletAndTransactions, handleAddFunds } from '@/app/actions';
import AddFundsModal from '@/components/dashboard/add-funds-modal';
import { useToast } from "@/hooks/use-toast";

const MOCK_USER_ID = 'defaultUser'; // Define MOCK_USER_ID for fallback

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const router = useRouter(); 
  const { toast } = useToast();

  const [wallet, setWallet] = React.useState<Wallet | null>(null);
  const [isWalletLoading, setIsWalletLoading] = React.useState(true);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = React.useState(false);
  const [isAddingFunds, setIsAddingFunds] = React.useState(false);

  const fetchWalletData = React.useCallback(async () => {
    setIsWalletLoading(true);
    const { wallet: fetchedWallet, error } = await handleGetWalletAndTransactions();
    if (error) {
      toast({ title: 'Error fetching wallet data', description: error, variant: 'destructive' });
      setWallet({ userId: MOCK_USER_ID, balance: 0 }); // Fallback to a default wallet on error
    } else {
      setWallet(fetchedWallet || { userId: MOCK_USER_ID, balance: 0 }); // Ensure a default wallet object if fetchedWallet is undefined
    }
    setIsWalletLoading(false);
  }, [toast]);

  React.useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const onAddFundsSubmit = async (amount: number) => {
    setIsAddingFunds(true);
    const formData = new FormData();
    formData.append('amount', amount.toString());
    const result = await handleAddFunds(formData);
    setIsAddingFunds(false);
    if (result.error) {
      toast({ title: 'Error Adding Funds', description: result.error, variant: 'destructive' });
    } else if (result.wallet) {
      // Removed direct setWallet(result.wallet);
      // Rely solely on fetchWalletData to refresh the wallet state from the source of truth (localStorage)
      await fetchWalletData(); 
      toast({ title: 'Funds Added', description: `Successfully added $${amount.toFixed(2)} to your wallet.` });
      setIsAddFundsModalOpen(false);
    }
  };

  const handleLogout = () => {
    // In a real app, you would clear session/token here
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
            isLoading={isWalletLoading} 
            onAddFundsClick={() => setIsAddFundsModalOpen(true)} 
          />
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


'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Subscription, Wallet, Transaction, SubscriptionStatus } from '@/types';
import SubscriptionsList from '@/components/dashboard/subscriptions-list';
import AlternativeSuggestionModal from '@/components/dashboard/alternative-suggestion-modal';
import AlertsSection from '@/components/dashboard/alerts-section';
import WalletDisplay from '@/components/dashboard/wallet-display';
import AddFundsModal from '@/components/dashboard/add-funds-modal';
import TransactionHistoryList from '@/components/dashboard/transaction-history-list';
import { 
  handleDetectCharges, 
  handleSuggestAlternatives,
  handleAddFunds,
  handleChargeSubscription,
  handleToggleSubscriptionStatus,
  handleGetWalletAndTransactions
} from '@/app/actions';
import { BarChart3, FileScan, Loader2 } from 'lucide-react';
import Image from 'next/image';

const MOCK_USER_ID = 'defaultUser';

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isSuggestingAlternatives, setIsSuggestingAlternatives] = useState(false);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  const fetchWalletData = async () => {
    const { wallet: fetchedWallet, transactions: fetchedTransactions, error } = await handleGetWalletAndTransactions();
    if (error) {
      toast({ title: 'Error fetching wallet data', description: error, variant: 'destructive' });
    } else {
      setWallet(fetchedWallet || { userId: MOCK_USER_ID, balance: 0 });
      setTransactions(fetchedTransactions || []);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchWalletData(); // Fetch wallet data on initial load

    // Load subscriptions from local storage
    const storedSubscriptions = localStorage.getItem('payright-subscriptions');
    if (storedSubscriptions) {
      try {
        const parsedSubs = JSON.parse(storedSubscriptions) as Subscription[];
        // Ensure status is initialized for older data
        const subsWithStatus = parsedSubs.map(sub => ({ ...sub, status: sub.status || 'active' }));
        if (Array.isArray(subsWithStatus) && (subsWithStatus.length === 0 || (subsWithStatus.length > 0 && 'vendor' in subsWithStatus[0]))) {
            setSubscriptions(subsWithStatus);
        } else {
            localStorage.removeItem('payright-subscriptions'); 
            setSubscriptions([]);
        }
      } catch (error) {
        console.error("Failed to parse subscriptions from localStorage", error);
        localStorage.removeItem('payright-subscriptions');
        setSubscriptions([]);
      }
    } else {
        setSubscriptions([]); 
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (!isLoading) { 
        localStorage.setItem('payright-subscriptions', JSON.stringify(subscriptions));
    }
  }, [subscriptions, isLoading]);


  const onChargesDetected = async (bankData: string) => {
    setIsLoading(true);
    setSubscriptions([]); 
    const result = await handleDetectCharges({ bankData });
    setIsLoading(false);

    if ('error' in result) {
      toast({ title: 'Error Detecting Charges', description: result.error, variant: 'destructive' });
      return;
    }
    
    if (Array.isArray(result) && result.length > 0) {
      const newSubs = result.map((charge, index) => ({
        ...charge, 
        id: `sub-${Date.now()}-${index}`, 
        isUnused: charge.usage_count === 0, 
        status: 'active' as SubscriptionStatus, // Default to active
      }));
      setSubscriptions(newSubs); 
      toast({ title: 'Charges Detected', description: `${newSubs.length} potential subscriptions found.` });
    } else {
      setSubscriptions([]);
      toast({ title: 'No Charges Detected', description: 'Could not find recurring charges from the provided data.' });
    }
  };

  const onSuggestAlternatives = async (subId: string) => {
    const subToUpdate = subscriptions.find(s => s.id === subId);
    if (!subToUpdate) {
        toast({ title: 'Error', description: 'Subscription not found.', variant: 'destructive' });
        return;
    }
    
    setIsSuggestingAlternatives(true);
    try {
      const result = await handleSuggestAlternatives({ 
        subscriptionName: subToUpdate.vendor, 
        currentCost: subToUpdate.amount 
      });

      if ('error' in result) {
        toast({ title: 'Error Suggesting Alternatives', description: result.error, variant: 'destructive' });
      } else {
        const updatedSubscriptionWithAlternatives = { 
          ...subToUpdate, 
          alternatives: result.alternatives, 
          alternativesReasoning: result.reasoning 
        };
        setSubscriptions(subs => subs.map(s => s.id === subId ? updatedSubscriptionWithAlternatives : s));
        setSelectedSubscription(updatedSubscriptionWithAlternatives);
        toast({ title: 'Alternatives Found', description: `Alternatives for ${subToUpdate.vendor} suggested.` });
      }
    } catch (e) {
      console.error("Exception in onSuggestAlternatives:", e);
      toast({ title: 'Error Suggesting Alternatives', description: "An unexpected error occurred.", variant: 'destructive' });
    } finally {
      setIsSuggestingAlternatives(false);
    }
  };

  const handleToggleUnused = (subId: string) => { // This can be phased out for status
    setSubscriptions(subs => 
      subs.map(s => 
        s.id === subId 
          ? { ...s, isUnused: !s.isUnused, unusedSince: !s.isUnused ? new Date().toISOString() : undefined } 
          : s
      )
    );
  };
  
  const handleOpenSuggestModal = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setIsSuggestModalOpen(true);
  };

  const handleDeleteSubscription = (subId: string) => {
    setSubscriptions(subs => subs.filter(s => s.id !== subId));
    toast({ title: 'Subscription Removed', description: 'The subscription has been removed from your list.' });
  };

  const handleSyncBankDataClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (file) {
      if (file.type !== 'text/csv') {
        toast({ title: 'Invalid File Type', description: 'Please upload a CSV file.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (text) {
          toast({ title: 'Processing CSV Data', description: 'Analyzing bank data from CSV...' });
          await onChargesDetected(text);
        } else {
          toast({ title: 'Error Reading File', description: 'Could not read CSV content.', variant: 'destructive' });
        }
      };
      reader.onerror = () => toast({ title: 'Error Reading File', description: 'Failed to read file.', variant: 'destructive' });
      reader.readAsText(file);
    }
  };

  const onAddFundsSubmit = async (amount: number) => {
    setIsAddingFunds(true);
    const formData = new FormData();
    formData.append('amount', amount.toString());
    const result = await handleAddFunds(formData);
    setIsAddingFunds(false);
    if (result.error) {
      toast({ title: 'Error Adding Funds', description: result.error, variant: 'destructive' });
    } else if (result.wallet) {
      setWallet(result.wallet);
      await fetchWalletData(); // Refresh transactions
      toast({ title: 'Funds Added', description: `Successfully added $${amount.toFixed(2)} to your wallet.` });
      setIsAddFundsModalOpen(false);
    }
  };

  const onChargeSubscription = async (sub: Subscription) => {
    setIsProcessingAction(true);
    const result = await handleChargeSubscription(sub);
    setIsProcessingAction(false);
    if (result.error) {
      toast({ title: 'Charging Error', description: result.error, variant: 'destructive' });
    } else {
      if (result.success && result.newBalance !== undefined && result.transaction) {
        setWallet(prev => prev ? { ...prev, balance: result.newBalance } : { userId: MOCK_USER_ID, balance: result.newBalance });
        setTransactions(prev => [result.transaction!, ...prev]);
        toast({ title: 'Charge Successful', description: `${sub.vendor} charged successfully. New balance: $${result.newBalance.toFixed(2)}` });
      } else {
         setTransactions(prev => [result.transaction!, ...prev]);
        toast({ title: 'Charge Failed', description: `Could not charge ${sub.vendor}. Insufficient funds or other error.`, variant: 'destructive' });
      }
    }
  };

  const onToggleSubscriptionStatus = async (subId: string, newStatus: SubscriptionStatus) => {
    setIsProcessingAction(true);
    const result = await handleToggleSubscriptionStatus(subId, newStatus);
    setIsProcessingAction(false);
    if (result.error) {
      toast({ title: 'Status Update Error', description: result.error, variant: 'destructive' });
    } else if (result.subscription) {
      setSubscriptions(subs => subs.map(s => s.id === subId ? result.subscription! : s));
      await fetchWalletData(); // Refresh transactions to show status change
      toast({ title: 'Status Updated', description: `${result.subscription.vendor} status set to ${newStatus}.` });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <WalletDisplay wallet={wallet} onAddFundsClick={() => setIsAddFundsModalOpen(true)} />
        <Card className="shadow-lg col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Subscription Management</CardTitle>
            <Button onClick={handleSyncBankDataClick} variant="outline" disabled={isLoading && subscriptions.length > 0}>
                <FileScan className="mr-2 h-4 w-4" /> Sync Bank Data (CSV)
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                style={{ display: 'none' }}
                id="csvFileInput"
            />
            </CardHeader>
            <CardContent>
            <CardDescription>
                Upload CSV to detect charges, manage statuses, and find alternatives.
            </CardDescription>
            </CardContent>
        </Card>
      </div>
      
      <AlertsSection subscriptions={subscriptions} />

      <TransactionHistoryList transactions={transactions} />

      {subscriptions.length === 0 && !isLoading ? (
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <div className="mx-auto bg-secondary p-4 rounded-full w-fit">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-xl font-semibold">No Subscriptions Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Click "Sync Bank Data (CSV)" to upload and analyze transactions.
            </p>
             <Image 
              src="https://picsum.photos/seed/dashboard_empty_alt/400/250" 
              alt="Empty dashboard illustration" 
              width={400} 
              height={250} 
              className="mx-auto mt-8 rounded-lg shadow-md"
              data-ai-hint="empty state illustration" 
            />
          </CardContent>
        </Card>
      ) : (
        isLoading && subscriptions.length === 0 ? (
           <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>Loading Subscriptions...</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </CardContent>
            </Card>
        ) : (
            <SubscriptionsList
            subscriptions={subscriptions}
            onSuggestAlternatives={handleOpenSuggestModal}
            onToggleUnused={handleToggleUnused} // Can be removed if status fully replaces it
            onDeleteSubscription={handleDeleteSubscription}
            onChargeSubscription={onChargeSubscription}
            onToggleSubscriptionStatus={onToggleSubscriptionStatus}
            isProcessingAction={isProcessingAction}
            isLoading={isLoading && subscriptions.length === 0} 
            />
        )
      )}

      {selectedSubscription && isSuggestModalOpen && (
        <AlternativeSuggestionModal
          isOpen={isSuggestModalOpen}
          onClose={() => { setIsSuggestModalOpen(false); setSelectedSubscription(null); }}
          subscription={selectedSubscription}
          onSuggest={onSuggestAlternatives} 
          isLoading={isSuggestingAlternatives}
        />
      )}

      {isAddFundsModalOpen && (
        <AddFundsModal
          isOpen={isAddFundsModalOpen}
          onClose={() => setIsAddFundsModalOpen(false)}
          onAddFunds={onAddFundsSubmit}
          isLoading={isAddingFunds}
        />
      )}
    </div>
  );
}

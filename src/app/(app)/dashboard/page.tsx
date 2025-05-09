
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Subscription, Transaction, SubscriptionStatus } from '@/types';
import SubscriptionsList from '@/components/dashboard/subscriptions-list';
import AlertsSection from '@/components/dashboard/alerts-section';
import TransactionHistoryList from '@/components/dashboard/transaction-history-list';
import { 
  handleDetectCharges, 
} from '@/app/actions';
import { 
  getTransactions as getTransactionsService,
  chargeForSubscription as chargeForSubscriptionService 
} from '@/services/walletService';
import { toggleSubscriptionStatus as toggleSubscriptionStatusService } from '@/services/subscriptionService';

import { BarChart3, FileScan, Loader2 } from 'lucide-react';
import Image from 'next/image';

const MOCK_USER_ID = 'defaultUser';

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchTransactionData = async () => {
    try {
      const fetchedTransactions = await getTransactionsService(MOCK_USER_ID);
      setTransactions(fetchedTransactions || []);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch transaction data.";
      toast({ title: 'Error fetching transaction data', description: errorMessage, variant: 'destructive' });
      setTransactions([]);
    }
  };


  useEffect(() => {
    setIsLoading(true);
    fetchTransactionData(); 

    const storedSubscriptions = localStorage.getItem('payright-subscriptions');
    if (storedSubscriptions) {
      try {
        const parsedSubs = JSON.parse(storedSubscriptions) as Subscription[];
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
        // Dispatch custom event whenever subscriptions are updated
        window.dispatchEvent(new CustomEvent('payright-subscriptions-updated'));
    }
  }, [subscriptions, isLoading]);


  const onChargesDetected = async (bankData: string) => {
    setIsLoading(true);
    setSubscriptions([]); 
    try {
      const result = await handleDetectCharges({ bankData }); 

      if ('error' in result) {
        toast({ title: 'Error Detecting Charges', description: result.error, variant: 'destructive' });
        return;
      }
      
      if (Array.isArray(result) && result.length > 0) {
        const newSubs = result.map((charge, index) => ({
          ...charge, 
          id: `sub-${Date.now()}-${index}`, 
          isUnused: charge.usage_count === 0, 
          status: 'active' as SubscriptionStatus, 
        }));
        setSubscriptions(newSubs); 
        toast({ title: 'Charges Detected', description: `${newSubs.length} potential subscriptions found.` });
      } else {
        setSubscriptions([]);
        toast({ title: 'No Charges Detected', description: 'Could not find recurring charges from the provided data.' });
      }
    } catch (clientError: any) {
      console.error("Client-side error calling handleDetectCharges:", clientError);
      const errorMessage = clientError instanceof Error ? clientError.message : "An unexpected error occurred while detecting charges.";
      toast({ title: 'Error Communicating with Server', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
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

  const onChargeSubscription = async (sub: Subscription) => {
    setIsProcessingAction(true);
    try {
      const result = await chargeForSubscriptionService(MOCK_USER_ID, sub); 
      if (result.success) {
        await fetchTransactionData(); 
        toast({ title: 'Charge Successful', description: `${sub.vendor} charged. New balance: $${result.newBalance.toFixed(2)}` });
      } else {
        await fetchTransactionData(); 
        toast({ title: 'Charge Failed', description: `Could not charge ${sub.vendor}. Insufficient funds.`, variant: 'destructive' });
      }
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred during charging.";
      toast({ title: 'Charging Error', description: errorMessage, variant: 'destructive' });
      await fetchTransactionData(); 
    } finally {
      setIsProcessingAction(false);
    }
  };

  const onToggleSubscriptionStatus = async (subId: string, newStatus: SubscriptionStatus) => {
    setIsProcessingAction(true);
    try {
      const updatedSubscription = await toggleSubscriptionStatusService(MOCK_USER_ID, subId, newStatus); 
      if (!updatedSubscription) {
        toast({ title: 'Status Update Error', description: "Subscription not found or failed to update.", variant: 'destructive' });
      } else {
        setSubscriptions(subs => subs.map(s => s.id === subId ? updatedSubscription : s));
        await fetchTransactionData(); 
        toast({ title: 'Status Updated', description: `${updatedSubscription.vendor} status set to ${newStatus}.` });
      }
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while updating status.";
      toast({ title: 'Status Update Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1"> 
        <Card className="shadow-lg col-span-1">
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
            onDeleteSubscription={handleDeleteSubscription}
            onChargeSubscription={onChargeSubscription}
            onToggleSubscriptionStatus={onToggleSubscriptionStatus}
            isProcessingAction={isProcessingAction}
            isLoading={isLoading && subscriptions.length === 0} 
            />
        )
      )}
    </div>
  );
}

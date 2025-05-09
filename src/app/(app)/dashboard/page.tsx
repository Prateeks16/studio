
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Subscription, SubscriptionStatus, Transaction, SubscriptionCategory } from '@/types';
import SubscriptionsList from '@/components/dashboard/subscriptions-list';
import AlertsSection from '@/components/dashboard/alerts-section';
import { 
  handleDetectCharges,
  handleDetectChargesFromEmail // Import the new action
} from '@/app/actions';
import { 
  chargeForSubscription as chargeForSubscriptionService 
} from '@/services/walletService';
import { toggleSubscriptionStatus as toggleSubscriptionStatusService } from '@/services/subscriptionService';
import { format, addMonths, addYears, parseISO, isValid } from 'date-fns'; 

import { BarChart3, FileScan, Loader2, Mail } from 'lucide-react'; // Added Mail icon
import { saveTransactionToStorage } from '@/lib/localStorageUtils'; 

const MOCK_USER_ID = 'defaultUser';

const MOCK_EMAIL_DATA = `
Subject: Your Netflix Bill - October

Hi John Doe,

Your monthly Netflix subscription for $16.99 has been processed on 2023-10-15.
Your next billing date is 2023-11-15.

Thanks,
The Netflix Team
---
Subject: Welcome to Spotify Premium!

Hey Jane Smith,

Thanks for subscribing to Spotify Premium!
Your first monthly payment of $10.99 will occur on 2023-10-20. You'll be billed monthly.
Enjoy 3 months free trial, first bill on 2024-01-20.

Enjoy the music!
Spotify
---
Subject: Your Adobe Creative Cloud Yearly Subscription

Dear Valued Customer,

Your annual subscription to Adobe Photoshop for $239.88 was successfully renewed on 2023-09-01.
This subscription will automatically renew on 2024-09-01.

Thank you,
Adobe Systems
---
Subject: Your Zoom Pro Plan

Hi User,

This is a confirmation for your Zoom Pro monthly plan.
Amount: $14.99
Billing Date: 2023-10-05
Next Payment: 2023-11-05

Zoom Video Communications
`;


export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // For general syncing state
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(true);

    const storedSubscriptions = localStorage.getItem('payright-subscriptions');
    if (storedSubscriptions) {
      try {
        const parsedSubs = JSON.parse(storedSubscriptions) as Subscription[];
        const subsWithStatusAndCategory = parsedSubs.map(sub => ({ 
            ...sub, 
            status: sub.status || 'active',
            category: sub.category || 'Other' as SubscriptionCategory 
        }));

        if (Array.isArray(subsWithStatusAndCategory) && (subsWithStatusAndCategory.length === 0 || (subsWithStatusAndCategory.length > 0 && 'vendor' in subsWithStatusAndCategory[0]))) {
            setSubscriptions(subsWithStatusAndCategory);
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
  }, []); 

  useEffect(() => {
    if (!isLoading) { 
        localStorage.setItem('payright-subscriptions', JSON.stringify(subscriptions));
        window.dispatchEvent(new CustomEvent('payright-subscriptions-updated'));
    }
  }, [subscriptions, isLoading]);

  const processDetectedChargesResult = (result: Subscription[] | { error: string }, source: string) => {
    if ('error' in result) {
        toast({ title: `Error Detecting Charges from ${source}`, description: result.error, variant: 'destructive' });
        return;
    }
    
    if (Array.isArray(result) && result.length > 0) {
    const newSubs = result.map((charge, index) => ({
        ...charge, 
        id: `sub-${source}-${Date.now()}-${index}`, 
        isUnused: charge.usage_count === 0, 
        status: 'active' as SubscriptionStatus,
        category: charge.category || 'Other' as SubscriptionCategory,
    }));
    setSubscriptions(newSubs); 
    toast({ title: `Charges Detected from ${source}`, description: `${newSubs.length} potential subscriptions found.` });
    } else {
    setSubscriptions([]); // Clear if no subs found from this source
    toast({ title: `No Charges Detected from ${source}`, description: `Could not find recurring charges from the provided ${source} data.` });
    }
  };
  
  const onChargesDetectedFromCsv = async (bankData: string) => {
    setIsSyncing(true);
    setSubscriptions([]); 
    try {
      const result = await handleDetectCharges({ bankData }); 
      processDetectedChargesResult(result, 'CSV');
    } catch (clientError: any) {
      console.error("Client-side error calling handleDetectCharges:", clientError);
      const errorMessage = clientError instanceof Error ? clientError.message : "An unexpected error occurred while detecting charges from CSV.";
      toast({ title: 'Error Processing CSV', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const onChargesDetectedFromEmail = async (emailContent: string) => {
    setIsSyncing(true);
    setSubscriptions([]);
    try {
      const result = await handleDetectChargesFromEmail({ emailContent });
      processDetectedChargesResult(result, 'Email');
    } catch (clientError: any)
{
      console.error("Client-side error calling handleDetectChargesFromEmail:", clientError);
      const errorMessage = clientError instanceof Error ? clientError.message : "An unexpected error occurred while detecting charges from Email.";
      toast({ title: 'Error Processing Email Data', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      if (isValid(parsedDate)) {
        return format(parsedDate, 'MMM d, yyyy');
      }
      return dateString; 
    } catch (error) {
      console.error("Error formatting date:", error, "Date string:", dateString);
      return dateString;
    }
  };

  const handleRenewSubscription = (subId: string) => {
    setIsProcessingAction(true);
    
    const subToRenew = subscriptions.find(s => s.id === subId);

    if (!subToRenew) {
      toast({ title: 'Error', description: 'Subscription not found for renewal.', variant: 'destructive'});
      setIsProcessingAction(false);
      return;
    }

    const originalStatus = subToRenew.status;
    const vendorName = subToRenew.vendor;
    
    const today = new Date();
    const newLastPaymentDate = format(today, 'yyyy-MM-dd');
    let newNextDueDate = newLastPaymentDate;
          
    try {
      const baseDateForNext = parseISO(newLastPaymentDate); 
      if (subToRenew.frequency.toLowerCase() === 'monthly') {
        newNextDueDate = format(addMonths(baseDateForNext, 1), 'yyyy-MM-dd');
      } else if (subToRenew.frequency.toLowerCase() === 'yearly') {
        newNextDueDate = format(addYears(baseDateForNext, 1), 'yyyy-MM-dd');
      } else {
        // Default to monthly if frequency is unclear or different
        newNextDueDate = format(addMonths(baseDateForNext, 1), 'yyyy-MM-dd'); 
      }
    } catch (e) {
      console.error("Error calculating next due date during renewal:", e);
       // Fallback if date parsing/calculation fails
      newNextDueDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd');
    }
    
    const newStatus: SubscriptionStatus = 'active';

    setSubscriptions(subs => 
      subs.map(s => 
        s.id === subId 
          ? { 
              ...s, 
              last_payment_date: newLastPaymentDate, 
              next_due_date: newNextDueDate, 
              status: newStatus 
            } 
          : s
      )
    );

    toast({ 
      title: 'Subscription Renewed', 
      description: `${vendorName} has been renewed and set to active. Next due date: ${formatDateSafe(newNextDueDate)}.` 
    });

    if (originalStatus === 'paused' && newStatus === 'active') {
      const transaction: Transaction = {
        id: `txn-status-renew-${Date.now()}`,
        userId: MOCK_USER_ID,
        type: 'status_change',
        description: `Subscription ${vendorName} status changed to active upon renewal.`,
        timestamp: new Date().toISOString(),
        subscriptionId: subId,
        relatedDetail: `Status of ${vendorName} set to active due to renewal.`
      };
      saveTransactionToStorage(transaction);
      window.dispatchEvent(new CustomEvent('payright-transactions-updated'));
    }
    
    setIsProcessingAction(false);
  };

  const handleSyncBankDataClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input

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
          await onChargesDetectedFromCsv(text);
        } else {
          toast({ title: 'Error Reading File', description: 'Could not read CSV content.', variant: 'destructive' });
        }
      };
      reader.onerror = () => toast({ title: 'Error Reading File', description: 'Failed to read file.', variant: 'destructive' });
      reader.readAsText(file);
    }
  };

  const handleSyncEmailDataClick = async () => {
    // Actual email integration (OAuth, API calls) is complex and outside current scope.
    // This will use MOCK_EMAIL_DATA for demonstration.
    toast({ title: 'Processing Email Data (Mock)', description: 'Analyzing mock email content for subscriptions...' });
    await onChargesDetectedFromEmail(MOCK_EMAIL_DATA);
    // In a real app, this would involve:
    // 1. Authenticating with user's email provider (OAuth).
    // 2. Fetching relevant emails (e.g., searching for keywords like "subscription", "invoice", "receipt").
    // 3. Passing the content of these emails to the `handleDetectChargesFromEmail` action.
  };


  const onChargeSubscription = async (sub: Subscription) => {
    setIsProcessingAction(true);
    try {
      const result = await chargeForSubscriptionService(MOCK_USER_ID, sub); 
      if (result.success) {
        window.dispatchEvent(new CustomEvent('payright-wallet-updated'));
        window.dispatchEvent(new CustomEvent('payright-transactions-updated'));
        toast({ title: 'Charge Successful', description: `${sub.vendor} charged. New balance: $${result.newBalance.toFixed(2)}` });
      } else {
        window.dispatchEvent(new CustomEvent('payright-wallet-updated'));
        window.dispatchEvent(new CustomEvent('payright-transactions-updated'));
        toast({ title: 'Charge Failed', description: `Could not charge ${sub.vendor}. Insufficient funds.`, variant: 'destructive' });
      }
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred during charging.";
      toast({ title: 'Charging Error', description: errorMessage, variant: 'destructive' });
      window.dispatchEvent(new CustomEvent('payright-wallet-updated'));
      window.dispatchEvent(new CustomEvent('payright-transactions-updated'));
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
        window.dispatchEvent(new CustomEvent('payright-transactions-updated'));
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
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-lg font-medium">Subscription Management</CardTitle>
                <CardDescription className="mt-1">
                    Upload CSV or sync (mock) email data to detect charges, manage statuses, and find alternatives.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button onClick={handleSyncBankDataClick} variant="outline" className="w-full sm:w-auto" disabled={isSyncing}>
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileScan className="mr-2 h-4 w-4" />}
                    Sync Bank Data (CSV)
                </Button>
                <Button onClick={handleSyncEmailDataClick} variant="outline" className="w-full sm:w-auto" disabled={isSyncing}>
                    {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    Sync Email (Conceptual)
                </Button>
              </div>
              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="csvFileInput"
              />
            </CardHeader>
            {/* Removed CardContent with description as it's now in CardHeader */}
        </Card>
      </div>
      
      <AlertsSection subscriptions={subscriptions} />

      {isLoading && subscriptions.length === 0 ? ( // Initial loading state
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle>Loading Subscriptions...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
        </Card>
      ) : isSyncing && subscriptions.length === 0 ? ( // Syncing state specifically when list is empty
        <Card className="shadow-lg">
            <CardHeader>
            <CardTitle>Analyzing Data...</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">Please wait while we process your data.</p>
            </CardContent>
        </Card>
      ) : subscriptions.length === 0 && !isSyncing ? ( // No subscriptions and not loading/syncing
        <Card className="text-center py-12 shadow-md">
          <CardHeader>
            <div className="mx-auto bg-secondary p-4 rounded-full w-fit">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="mt-4 text-xl font-semibold">No Subscriptions Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Use the "Sync" buttons above to upload and analyze transactions from CSV or (mock) Email.
            </p>
          </CardContent>
        </Card>
      ) : ( // Subscriptions available or syncing with existing data
        <SubscriptionsList
          subscriptions={subscriptions}
          onRenewSubscription={handleRenewSubscription}
          onChargeSubscription={onChargeSubscription}
          onToggleSubscriptionStatus={onToggleSubscriptionStatus}
          isProcessingAction={isProcessingAction || isSyncing} // Disable actions while syncing too
          isLoading={isLoading && subscriptions.length === 0} 
          onToggleUnused={() => { /* Placeholder for onToggleUnused if needed elsewhere */ }}
        />
      )}
    </div>
  );
}

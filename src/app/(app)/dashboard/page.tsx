'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Subscription } from '@/types';
import SubscriptionsList from '@/components/dashboard/subscriptions-list';
import AlternativeSuggestionModal from '@/components/dashboard/alternative-suggestion-modal';
import AlertsSection from '@/components/dashboard/alerts-section';
import { handleDetectCharges, handleSuggestAlternatives } from '@/app/actions';
import { BarChart3, FileScan } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isSuggestingAlternatives, setIsSuggestingAlternatives] = useState(false); // New state for suggestion loading

  const onChargesDetected = async (bankData: string) => {
    setIsLoading(true);
    setSubscriptions([]); // Clear existing subscriptions
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
      }));
      setSubscriptions(newSubs); 
      toast({ title: 'Charges Detected', description: `${newSubs.length} potential subscriptions found.` });
    } else {
      setSubscriptions([]);
      toast({ title: 'No Charges Detected', description: 'Could not find recurring charges from the provided data.' });
    }
  };
  
  useEffect(() => {
    setIsLoading(true);
    const storedSubscriptions = localStorage.getItem('payright-subscriptions');
    if (storedSubscriptions) {
      try {
        const parsedSubs = JSON.parse(storedSubscriptions);
        if (Array.isArray(parsedSubs) && (parsedSubs.length === 0 || (parsedSubs.length > 0 && 'vendor' in parsedSubs[0]))) {
            setSubscriptions(parsedSubs);
        } else {
            console.warn("Invalid data in localStorage, clearing and starting fresh.");
            localStorage.removeItem('payright-subscriptions'); 
            setSubscriptions([]);
        }
      } catch (error) {
        console.error("Failed to parse subscriptions from localStorage, starting fresh", error);
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


  const onSuggestAlternatives = async (subId: string, userNeeds: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;
    
    setIsSuggestingAlternatives(true);
    try {
      const result = await handleSuggestAlternatives({ 
        subscriptionName: sub.vendor, 
        userNeeds, 
        currentCost: sub.amount 
      });

      if ('error' in result) {
        toast({ title: 'Error Suggesting Alternatives', description: result.error, variant: 'destructive' });
        // Keep modal open on error if needed, or close:
        // setIsSuggestModalOpen(false); 
        return;
      }
      
      setSubscriptions(subs => subs.map(s => s.id === subId ? { ...s, alternatives: result.alternatives, alternativesReasoning: result.reasoning, userNeeds } : s));
      toast({ title: 'Alternatives Found', description: `Alternatives for ${sub.vendor} suggested.` });
      setIsSuggestModalOpen(false); 
    } catch (e) {
      console.error("Exception in onSuggestAlternatives:", e);
      toast({ title: 'Error Suggesting Alternatives', description: "An unexpected error occurred while fetching suggestions.", variant: 'destructive' });
    } finally {
      setIsSuggestingAlternatives(false);
    }
  };

  const handleToggleUnused = (subId: string) => {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (file) {
      if (file.type !== 'text/csv') {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a CSV file.',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (text) {
          toast({ title: 'Processing CSV Data', description: 'Analyzing bank data from CSV...' });
          await onChargesDetected(text);
        } else {
          toast({ title: 'Error Reading File', description: 'Could not read the CSV file content.', variant: 'destructive' });
        }
      };
      reader.onerror = () => {
        toast({ title: 'Error Reading File', description: 'Failed to read the file.', variant: 'destructive' });
      };
      reader.readAsText(file);
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Subscription Dashboard</CardTitle>
           <Button onClick={handleSyncBankDataClick} variant="outline" disabled={isLoading}>
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
            Upload a CSV file with your bank transactions to detect recurring charges, and find potential cost-saving alternatives.
          </CardDescription>
        </CardContent>
      </Card>

      <AlertsSection subscriptions={subscriptions} />

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
              Your dashboard is empty. Click "Sync Bank Data (CSV)" to upload and analyze your transactions.
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
        <SubscriptionsList
          subscriptions={subscriptions}
          onSuggestAlternatives={handleOpenSuggestModal}
          onToggleUnused={handleToggleUnused}
          onDeleteSubscription={handleDeleteSubscription}
          isLoading={isLoading} 
        />
      )}

      {selectedSubscription && isSuggestModalOpen && (
        <AlternativeSuggestionModal
          isOpen={isSuggestModalOpen}
          onClose={() => { setIsSuggestModalOpen(false); setSelectedSubscription(null); }}
          subscription={selectedSubscription}
          onSuggest={onSuggestAlternatives}
          isLoading={isSuggestingAlternatives} // Pass the new loading state
        />
      )}
    </div>
  );
}

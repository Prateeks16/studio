'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Subscription } from '@/types';
import SubscriptionsList from '@/components/dashboard/subscriptions-list';
import AlternativeSuggestionModal from '@/components/dashboard/alternative-suggestion-modal';
import AlertsSection from '@/components/dashboard/alerts-section';
import { handleDetectCharges, handleSuggestAlternatives } from '@/app/actions';
import type { DetectRecurringChargesOutput, SuggestSubscriptionAlternativesOutput } from '@/types';
import { BarChart3, FileScan } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const { toast } = useToast();

  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const generateMockBankData = () => {
    // This is where you can provide more diverse or specific mock data
    // For now, it uses the same data as before.
    return `
      Transaction: Netflix Premium - $19.99 on 2024-06-15 for monthly streaming
      Transaction: Spotify Family Plan - $16.99 on 2024-06-10 for music service
      Transaction: AWS Cloud Services - $75.30 on 2024-06-01 for web hosting
      Transaction: Adobe Photoshop - $20.99 on 2024-06-20 (monthly subscription)
      Transaction: Zoom Pro Annual - $149.90 on 2024-01-05 (yearly video conferencing)
      Transaction: Audible - $14.95 on 2024-06-03 (audiobooks)
      Transaction: UnusedGymMembership - $39.99 on 2024-06-05 (gym access, never used)
      Transaction: YouTube Premium - $11.99 on 2024-05-28 for ad-free videos
      Transaction: iCloud Storage 200GB - $2.99 on 2024-06-12
    `;
  };

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
      toast({ title: 'No Charges Detected', description: 'Could not find recurring charges from the provided data.' });
    }
  };
  
  // useEffect to load subscriptions from localStorage on initial mount
  useEffect(() => {
    setIsLoading(true);
    const storedSubscriptions = localStorage.getItem('payright-subscriptions');
    if (storedSubscriptions) {
      try {
        const parsedSubs = JSON.parse(storedSubscriptions);
        if (Array.isArray(parsedSubs) && (parsedSubs.length === 0 || (parsedSubs.length > 0 && 'vendor' in parsedSubs[0]))) {
            setSubscriptions(parsedSubs);
        } else {
            console.warn("Invalid data in localStorage, clearing.");
            localStorage.removeItem('payright-subscriptions'); 
        }
      } catch (error) {
        console.error("Failed to parse subscriptions from localStorage", error);
        localStorage.removeItem('payright-subscriptions');
      }
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: run only on mount and unmount

  // useEffect to save subscriptions to localStorage whenever they change (and not loading)
  useEffect(() => {
    if (!isLoading) { 
        localStorage.setItem('payright-subscriptions', JSON.stringify(subscriptions));
    }
  }, [subscriptions, isLoading]);


  const onSuggestAlternatives = async (subId: string, userNeeds: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;
    
    // No need to set isLoading for the whole page here, as the modal has its own loading state.
    // However, if the modal's isLoading prop is tied to the page's isLoading, keep it.
    // For now, let's assume the modal handles its own loading state primarily.
    // setIsSuggestModalOpen(false) will be called after the API call.

    const result = await handleSuggestAlternatives({ 
      subscriptionName: sub.vendor, 
      userNeeds, 
      currentCost: sub.amount 
    });
    // Set modal's loading to false if applicable, or page's if it was set true for this.

    if ('error' in result) {
      toast({ title: 'Error Suggesting Alternatives', description: result.error, variant: 'destructive' });
      setIsSuggestModalOpen(false); // Close modal on error too
      return;
    }
    
    setSubscriptions(subs => subs.map(s => s.id === subId ? { ...s, alternatives: result.alternatives, alternativesReasoning: result.reasoning, userNeeds } : s));
    toast({ title: 'Alternatives Found', description: `Alternatives for ${sub.vendor} suggested.` });
    setIsSuggestModalOpen(false); // Close modal on success
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

  const handleSyncBankData = () => {
    toast({ title: 'Syncing Bank Data', description: 'Analyzing mock bank data for subscriptions...' });
    onChargesDetected(generateMockBankData());
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Subscription Dashboard</CardTitle>
           <Button onClick={handleSyncBankData} variant="outline" disabled={isLoading && subscriptions.length > 0}>
            <FileScan className="mr-2 h-4 w-4" /> Sync Bank Data
          </Button>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Analyze mock bank data to detect recurring charges, estimate renewals, and find potential cost-saving alternatives.
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
              Your dashboard is empty. Click "Sync Bank Data" to analyze mock transactions and find your subscriptions.
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
          isLoading={isLoading} // Pass isLoading to show loading state in list if needed
        />
      )}

      {selectedSubscription && isSuggestModalOpen && (
        <AlternativeSuggestionModal
          isOpen={isSuggestModalOpen}
          onClose={() => { setIsSuggestModalOpen(false); setSelectedSubscription(null); }}
          subscription={selectedSubscription}
          onSuggest={onSuggestAlternatives}
          // The modal should ideally have its own internal loading state for the suggest action.
          // Passing the page's isLoading might not be ideal if suggest is quick & page is loading other things.
          // For now, let's assume the modal's onSuggest will handle its specific loading indication.
          isLoading={false} // Let modal manage its own submit button loading state.
        />
      )}
    </div>
  );
}

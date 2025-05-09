'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Subscription } from '@/types';
// ChargeDetectionModal is removed
import SubscriptionsList from '@/components/dashboard/subscriptions-list';
// PredictRenewalModal is removed
import AlternativeSuggestionModal from '@/components/dashboard/alternative-suggestion-modal';
import AlertsSection from '@/components/dashboard/alerts-section';
import { handleDetectCharges, handleSuggestAlternatives } from '@/app/actions';
// PredictRenewalDatesOutput is removed
import type { DetectRecurringChargesOutput, SuggestSubscriptionAlternativesOutput } from '@/types';
import { PlusCircle, BarChart3 } from 'lucide-react'; // FileScan removed
import Image from 'next/image';

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start loading true for initial data fetch
  const { toast } = useToast();

  // isChargeModalOpen is removed
  // isPredictModalOpen is removed
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  const generateMockBankData = () => {
    // More detailed mock data for better AI parsing
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
    setSubscriptions([]); // Clear existing subscriptions when new data is analyzed
    const result = await handleDetectCharges({ bankData });
    setIsLoading(false);
    // setIsChargeModalOpen(false) removed;

    if ('error' in result) {
      toast({ title: 'Error Detecting Charges', description: result.error, variant: 'destructive' });
      return;
    }
    
    if (Array.isArray(result) && result.length > 0) {
      const newSubs = result.map((charge, index) => ({
        ...charge, // Includes vendor, amount, frequency, last_payment_date, next_due_date, usage_count
        id: `sub-${Date.now()}-${index}`, // Simple unique ID
        isUnused: charge.usage_count === 0, // Initial unused status from AI
      }));
      setSubscriptions(newSubs); // Replace, not spread into previous
      toast({ title: 'Charges Detected', description: `${newSubs.length} potential subscriptions found.` });
    } else {
      toast({ title: 'No Charges Detected', description: 'Could not find recurring charges from the provided data.' });
    }
  };
  
  // Load and analyze mock data on component mount
  useEffect(() => {
    const initialBankData = generateMockBankData();
    onChargesDetected(initialBankData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Effect to save subscriptions to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) { // Only save after initial load/analysis
        localStorage.setItem('payright-subscriptions', JSON.stringify(subscriptions));
    }
  }, [subscriptions, isLoading]);

  // Effect to load subscriptions from localStorage on mount (if not doing initial AI analysis)
  // This will be overridden by the AI analysis on first load, but useful for persistence after that
  useEffect(() => {
    const storedSubscriptions = localStorage.getItem('payright-subscriptions');
    if (storedSubscriptions && subscriptions.length === 0 && !isLoading) { // only load if subs are empty and not currently loading
      try {
        const parsedSubs = JSON.parse(storedSubscriptions);
        // Check if parsedSubs structure matches the current Subscription type
        if (parsedSubs.length > 0 && 'vendor' in parsedSubs[0]) {
            setSubscriptions(parsedSubs);
        } else {
            localStorage.removeItem('payright-subscriptions'); // Clear potentially outdated data
        }
      } catch (error) {
        console.error("Failed to parse subscriptions from localStorage", error);
        localStorage.removeItem('payright-subscriptions');
      }
    }
  }, [isLoading]); // dependencies ensure this runs after initial loading may complete


  // onPredictRenewal and related logic are removed

  const onSuggestAlternatives = async (subId: string, userNeeds: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;
    
    setIsLoading(true);
    const result = await handleSuggestAlternatives({ 
      subscriptionName: sub.vendor, // Use vendor as subscriptionName for the AI
      userNeeds, 
      currentCost: sub.amount 
    });
    setIsLoading(false);
    setIsSuggestModalOpen(false);

    if ('error' in result) {
      toast({ title: 'Error Suggesting Alternatives', description: result.error, variant: 'destructive' });
      return;
    }
    
    setSubscriptions(subs => subs.map(s => s.id === subId ? { ...s, alternatives: result.alternatives, alternativesReasoning: result.reasoning, userNeeds } : s));
    toast({ title: 'Alternatives Found', description: `Alternatives for ${sub.vendor} suggested.` });
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
  
  // handleOpenPredictModal is removed

  const handleOpenSuggestModal = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setIsSuggestModalOpen(true);
  };

  const handleDeleteSubscription = (subId: string) => {
    setSubscriptions(subs => subs.filter(s => s.id !== subId));
    toast({ title: 'Subscription Removed', description: 'The subscription has been removed from your list.' });
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Subscription Dashboard</CardTitle>
          {/* Analyze Bank Data Button is removed */}
        </CardHeader>
        <CardContent>
          <CardDescription>
            Automatically detected recurring charges, estimated renewals, and potential cost-saving alternatives.
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
              Our AI didn't find any recurring subscriptions in the mock data.
              <br />
              This is a demo, so real data would yield results.
            </p>
            {/* Button to manually add subscriptions could go here if desired in future */}
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
          // onPredictRenewal is removed
          onSuggestAlternatives={handleOpenSuggestModal}
          onToggleUnused={handleToggleUnused}
          onDeleteSubscription={handleDeleteSubscription}
          isLoading={isLoading}
        />
      )}

      {/* ChargeDetectionModal is removed */}

      {/* PredictRenewalModal is removed */}
      {selectedSubscription && isSuggestModalOpen && (
        <AlternativeSuggestionModal
          isOpen={isSuggestModalOpen}
          onClose={() => { setIsSuggestModalOpen(false); setSelectedSubscription(null); }}
          subscription={selectedSubscription}
          onSuggest={onSuggestAlternatives}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
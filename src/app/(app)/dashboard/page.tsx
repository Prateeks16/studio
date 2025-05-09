'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Subscription } from '@/types';
import ChargeDetectionModal from '@/components/dashboard/charge-detection-modal';
import SubscriptionsList from '@/components/dashboard/subscriptions-list';
import PredictRenewalModal from '@/components/dashboard/predict-renewal-modal';
import AlternativeSuggestionModal from '@/components/dashboard/alternative-suggestion-modal';
import AlertsSection from '@/components/dashboard/alerts-section';
import { handleDetectCharges, handlePredictRenewal, handleSuggestAlternatives } from '@/app/actions';
import type { DetectRecurringChargesOutput, PredictRenewalDatesOutput, SuggestSubscriptionAlternativesOutput } from '@/types';
import { FileScan, PlusCircle, BarChart3 } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [isPredictModalOpen, setIsPredictModalOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Effect to load subscriptions from localStorage on mount
  useEffect(() => {
    const storedSubscriptions = localStorage.getItem('payright-subscriptions');
    if (storedSubscriptions) {
      try {
        setSubscriptions(JSON.parse(storedSubscriptions));
      } catch (error) {
        console.error("Failed to parse subscriptions from localStorage", error);
        localStorage.removeItem('payright-subscriptions'); // Clear corrupted data
      }
    }
  }, []);

  // Effect to save subscriptions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('payright-subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);


  const onChargesDetected = async (bankData: string) => {
    setIsLoading(true);
    const result = await handleDetectCharges({ bankData });
    setIsLoading(false);
    setIsChargeModalOpen(false);

    if ('error' in result) {
      toast({ title: 'Error Detecting Charges', description: result.error, variant: 'destructive' });
      return;
    }
    
    if (Array.isArray(result) && result.length > 0) {
      const newSubs = result.map((charge, index) => ({
        ...charge,
        id: `sub-${Date.now()}-${index}`, // Simple unique ID
      }));
      setSubscriptions(prevSubs => [...prevSubs, ...newSubs]);
      toast({ title: 'Charges Detected', description: `${newSubs.length} new potential subscriptions found.` });
    } else {
      toast({ title: 'No New Charges Detected', description: 'Could not find new recurring charges from the provided data.' });
    }
  };

  const onPredictRenewal = async (subId: string, lastPaymentDate: string, billingCycle: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;

    setIsLoading(true);
    const result = await handlePredictRenewal({ 
      subscriptionName: sub.subscriptionName, 
      lastPaymentDate, 
      billingCycle 
    });
    setIsLoading(false);
    setIsPredictModalOpen(false);

    if ('error' in result) {
      toast({ title: 'Error Predicting Renewal', description: result.error, variant: 'destructive' });
      return;
    }

    setSubscriptions(subs => subs.map(s => s.id === subId ? { ...s, predictedRenewalDate: result.predictedRenewalDate, renewalConfidence: result.confidence, lastPaymentDate, billingCycle } : s));
    toast({ title: 'Renewal Predicted', description: `Renewal date for ${sub.subscriptionName} updated.` });
  };

  const onSuggestAlternatives = async (subId: string, userNeeds: string) => {
    const sub = subscriptions.find(s => s.id === subId);
    if (!sub) return;
    
    setIsLoading(true);
    const result = await handleSuggestAlternatives({ 
      subscriptionName: sub.subscriptionName, 
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
    toast({ title: 'Alternatives Found', description: `Alternatives for ${sub.subscriptionName} suggested.` });
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
  
  const handleOpenPredictModal = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setIsPredictModalOpen(true);
  };

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
          <Button onClick={() => setIsChargeModalOpen(true)} variant="default">
            <FileScan className="mr-2 h-4 w-4" /> Analyze Bank Data
          </Button>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Manage your recurring charges, predict renewals, and find cost-saving alternatives.
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
            <CardTitle className="mt-4 text-xl font-semibold">No Subscriptions Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              It looks like you haven't added any subscriptions.
              <br />
              Click the button below to analyze your bank data and get started.
            </p>
            <Button onClick={() => setIsChargeModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Subscriptions
            </Button>
             <Image 
              src="https://picsum.photos/seed/dashboard_empty/400/250" 
              alt="Empty dashboard illustration" 
              width={400} 
              height={250} 
              className="mx-auto mt-8 rounded-lg shadow-md"
              data-ai-hint="financial chart data" 
            />
          </CardContent>
        </Card>
      ) : (
        <SubscriptionsList
          subscriptions={subscriptions}
          onPredictRenewal={handleOpenPredictModal}
          onSuggestAlternatives={handleOpenSuggestModal}
          onToggleUnused={handleToggleUnused}
          onDeleteSubscription={handleDeleteSubscription}
          isLoading={isLoading}
        />
      )}

      {isChargeModalOpen && (
        <ChargeDetectionModal
          isOpen={isChargeModalOpen}
          onClose={() => setIsChargeModalOpen(false)}
          onDetect={onChargesDetected}
          isLoading={isLoading}
        />
      )}

      {selectedSubscription && isPredictModalOpen && (
        <PredictRenewalModal
          isOpen={isPredictModalOpen}
          onClose={() => { setIsPredictModalOpen(false); setSelectedSubscription(null);}}
          subscription={selectedSubscription}
          onPredict={onPredictRenewal}
          isLoading={isLoading}
        />
      )}

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

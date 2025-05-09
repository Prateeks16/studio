
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Subscription, SuggestSubscriptionAlternativesOutput } from '@/types';
import { handleSuggestAlternatives } from '@/app/actions';
import { Lightbulb, Loader2 } from 'lucide-react';
import { getSubscriptionsFromStorage } from '@/lib/localStorageUtils'; // To load subscriptions

export default function SidebarAiSuggestionWidget() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | undefined>(undefined);
  const [suggestionResult, setSuggestionResult] = useState<SuggestSubscriptionAlternativesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load subscriptions from localStorage for the Select dropdown
    const storedSubscriptions = getSubscriptionsFromStorage();
    setSubscriptions(storedSubscriptions.filter(sub => sub.status === 'active')); // Only suggest for active subs
  }, []);
  
  // Re-fetch subscriptions if they change in localStorage (e.g. after bank data sync)
  // This might be too frequent or inefficient, consider a more targeted update mechanism if performance issues arise.
  useEffect(() => {
    const handleStorageChange = () => {
        const storedSubscriptions = getSubscriptionsFromStorage();
        setSubscriptions(storedSubscriptions.filter(sub => sub.status === 'active'));
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for a custom event that DashboardPage could dispatch after updating subscriptions
    // This is a more reliable way to update than just 'storage' event.
    const handleSubscriptionsUpdated = () => {
        const storedSubscriptions = getSubscriptionsFromStorage();
        setSubscriptions(storedSubscriptions.filter(sub => sub.status === 'active'));
    };
    window.addEventListener('payright-subscriptions-updated', handleSubscriptionsUpdated);


    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('payright-subscriptions-updated', handleSubscriptionsUpdated);
    };
  }, []);


  const handleSuggest = async () => {
    if (!selectedSubscriptionId) {
      toast({ title: 'No Subscription Selected', description: 'Please select a subscription to get alternatives.', variant: 'destructive' });
      return;
    }

    const selectedSub = subscriptions.find(s => s.id === selectedSubscriptionId);
    if (!selectedSub) {
      toast({ title: 'Error', description: 'Selected subscription not found.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestionResult(null);

    try {
      const result = await handleSuggestAlternatives({
        subscriptionName: selectedSub.vendor,
        currentCost: selectedSub.amount,
      });

      if ('error' in result) {
        setError(result.error);
        toast({ title: 'Error Suggesting Alternatives', description: result.error, variant: 'destructive' });
      } else {
        setSuggestionResult(result);
        toast({ title: 'Alternatives Found', description: `Suggestions for ${selectedSub.vendor} are ready.` });
      }
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({ title: 'Error Suggesting Alternatives', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4 border-sidebar-border bg-sidebar-accent/10 shadow-md group-data-[collapsible=icon]:hidden">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-semibold flex items-center text-sidebar-foreground">
          <Lightbulb className="h-4 w-4 mr-2 text-sidebar-primary" />
          AI Suggests Alternatives
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div>
          <Label htmlFor="subscription-select" className="text-xs text-sidebar-foreground/80">Select Subscription</Label>
          <Select value={selectedSubscriptionId} onValueChange={setSelectedSubscriptionId}>
            <SelectTrigger id="subscription-select" className="w-full h-9 text-xs bg-background mt-1">
              <SelectValue placeholder="Choose a subscription..." />
            </SelectTrigger>
            <SelectContent>
              {subscriptions.length > 0 ? (
                subscriptions.map(sub => (
                  <SelectItem key={sub.id} value={sub.id} className="text-xs">
                    {sub.vendor} (${sub.amount.toFixed(2)}/{sub.frequency})
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-subs" disabled className="text-xs">No active subscriptions</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSuggest} disabled={isLoading || !selectedSubscriptionId || subscriptions.length === 0} className="w-full h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-3 w-3" /> }
          Get Suggestions
        </Button>

        {suggestionResult && !isLoading && (
          <div className="mt-3 p-2 bg-background/50 rounded-md space-y-2">
            <h4 className="text-xs font-medium text-foreground">Alternatives for {subscriptions.find(s=>s.id === selectedSubscriptionId)?.vendor}:</h4>
            {suggestionResult.alternatives.length > 0 ? (
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                {suggestionResult.alternatives.map((alt, index) => (
                    <li key={index}>{alt}</li>
                ))}
                </ul>
            ): (
                <p className="text-xs text-muted-foreground">No specific alternatives found by AI.</p>
            )}
            {suggestionResult.reasoning && (
              <p className="text-xs text-muted-foreground italic pt-1 border-t border-border/50">
                <span className="font-medium">Reasoning:</span> {suggestionResult.reasoning}
              </p>
            )}
          </div>
        )}
        {error && !isLoading && (
            <p className="mt-3 text-xs text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
        )}
        {!isLoading && !suggestionResult && !error && selectedSubscriptionId && (
            <p className="mt-3 text-xs text-muted-foreground text-center">Click "Get Suggestions" to see AI recommendations.</p>
        )}

      </CardContent>
    </Card>
  );
}


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
// Textarea removed as it's no longer used
import { useToast } from '@/hooks/use-toast';
import type { Subscription, SuggestSubscriptionAlternativesOutput } from '@/types';
import { handleSuggestAlternatives } from '@/app/actions';
import { Lightbulb, Loader2, Wand2 } from 'lucide-react';
import { getSubscriptionsFromStorage } from '@/lib/localStorageUtils';

export default function AiSuggestionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | undefined>(undefined);
  const [suggestionResult, setSuggestionResult] = useState<SuggestSubscriptionAlternativesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubscriptions = useCallback(() => {
    const storedSubscriptions = getSubscriptionsFromStorage();
    setSubscriptions(storedSubscriptions.filter(sub => sub.status === 'active'));
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    
    const handleStorageChange = () => fetchSubscriptions();
    const handleSubscriptionsUpdated = () => fetchSubscriptions();

    window.addEventListener('storage', handleStorageChange); // For direct localStorage changes
    window.addEventListener('payright-subscriptions-updated', handleSubscriptionsUpdated); // For custom event

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('payright-subscriptions-updated', handleSubscriptionsUpdated);
    };
  }, [fetchSubscriptions]);

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
        toast({ title: 'Alternatives Found', description: `AI suggestions for ${selectedSub.vendor} are ready.` });
      }
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while suggesting alternatives.";
      setError(errorMessage);
      toast({ title: 'Error Suggesting Alternatives', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const selectedSubscriptionDetails = subscriptions.find(s => s.id === selectedSubscriptionId);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <Wand2 className="h-6 w-6 text-primary mr-3" />
            <CardTitle className="text-xl font-semibold">AI-Powered Alternative Suggestions</CardTitle>
          </div>
          <CardDescription>
            Select one of your active subscriptions, and our AI will suggest free or cheaper alternatives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subscription-select" className="text-sm font-medium">Select Subscription</Label>
            <Select value={selectedSubscriptionId} onValueChange={setSelectedSubscriptionId}>
              <SelectTrigger id="subscription-select" className="w-full mt-1">
                <SelectValue placeholder="Choose an active subscription..." />
              </SelectTrigger>
              <SelectContent>
                {subscriptions.length > 0 ? (
                  subscriptions.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.vendor} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sub.amount)}/{sub.frequency})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-subs" disabled>No active subscriptions found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {selectedSubscriptionDetails && (
             <div className="p-4 bg-secondary/50 rounded-lg">
                <h3 className="text-sm font-medium text-foreground">Selected: {selectedSubscriptionDetails.vendor}</h3>
                <p className="text-xs text-muted-foreground">
                    Cost: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedSubscriptionDetails.amount)} / {selectedSubscriptionDetails.frequency}
                </p>
             </div>
          )}

          <Button 
            onClick={handleSuggest} 
            disabled={isLoading || !selectedSubscriptionId || subscriptions.length === 0} 
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" /> }
            Get AI Suggestions
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="shadow-md">
            <CardContent className="p-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">AI is thinking... please wait.</p>
            </CardContent>
        </Card>
      )}

      {error && !isLoading && (
        <Card className="shadow-md border-destructive bg-destructive/10">
            <CardHeader>
                <CardTitle className="text-destructive text-lg">Suggestion Error</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive/80">{error}</p>
            </CardContent>
        </Card>
      )}

      {suggestionResult && !isLoading && !error && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">
              AI Suggestions for {subscriptions.find(s => s.id === selectedSubscriptionId)?.vendor || 'Selected Subscription'}
            </CardTitle>
            <CardDescription>
              Our AI analyzed common use cases and found these potential alternatives:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestionResult.alternatives.length > 0 ? (
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Suggested Alternatives:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground bg-secondary/30 p-3 rounded-md">
                  {suggestionResult.alternatives.map((alt, index) => (
                    <li key={index}>{alt}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted-foreground">The AI could not find specific alternatives for this subscription at the moment.</p>
            )}
            
            {/* Reasoning section has been removed */}
            {/* 
            {suggestionResult.reasoning && (
                <div>
                    <h4 className="font-semibold mb-1 text-foreground">AI's Reasoning:</h4>
                    <p className="text-sm text-muted-foreground italic bg-secondary/30 p-3 rounded-md">{suggestionResult.reasoning}</p>
                </div>
            )}
            */}
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !suggestionResult && !error && selectedSubscriptionId && (
        <Card className="shadow-md">
            <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Click "Get AI Suggestions" to see recommendations for the selected subscription.</p>
            </CardContent>
        </Card>
      )}
      {!selectedSubscriptionId && !isLoading && subscriptions.length > 0 && (
        <Card className="shadow-md">
            <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Please select an active subscription above to get AI-powered alternatives.</p>
            </CardContent>
        </Card>
      )}
       {subscriptions.length === 0 && !isLoading && (
        <Card className="shadow-md">
            <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No active subscriptions found. Please sync your bank data on the Dashboard to detect subscriptions first, or ensure they are active.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

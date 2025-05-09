'use client';

import { useState, useEffect } from 'react';
import type { Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AlternativeSuggestionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onSuggest: (subscriptionId: string, userNeeds: string) => Promise<void>;
  isLoading: boolean;
};

export default function AlternativeSuggestionModal({
  isOpen,
  onClose,
  subscription,
  onSuggest,
  isLoading,
}: AlternativeSuggestionModalProps) {
  const [userNeeds, setUserNeeds] = useState(subscription.userNeeds || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUserNeeds(subscription.userNeeds || '');
      setError(null);
    }
  }, [isOpen, subscription]);

  const handleSubmit = async () => {
    if (!userNeeds.trim()) {
      setError('Please describe your needs for this subscription.');
      return;
    }
     if (userNeeds.trim().length < 10) {
      setError('Please provide a more detailed description of your needs (at least 10 characters).');
      return;
    }
    setError(null);
    // The onSuggest function in dashboard/page.tsx already handles passing subscription.vendor as subscriptionName
    await onSuggest(subscription.id, userNeeds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Find Alternatives for {subscription.vendor}</DialogTitle>
          <DialogDescription>
            Current cost: ${subscription.amount.toFixed(2)} / {subscription.frequency}. 
            Describe what you primarily use this subscription for to get better alternative suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="userNeeds" className="text-left">
              Your Needs / How you use it
            </Label>
            <Textarea
              id="userNeeds"
              value={userNeeds}
              onChange={(e) => setUserNeeds(e.target.value)}
              placeholder="e.g., I use it for streaming movies, listening to music, cloud storage..."
              className="col-span-3 min-h-[100px] focus:ring-primary"
              disabled={isLoading}
            />
          </div>
           {subscription.alternatives && subscription.alternatives.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-sm">Previously Suggested Alternatives:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">
                {subscription.alternatives.map((alt, index) => (
                  <li key={index}>{alt}</li>
                ))}
              </ul>
              {subscription.alternativesReasoning && (
                <p className="text-xs text-muted-foreground mt-1 italic p-2 bg-secondary/30 rounded-md">Reasoning: {subscription.alternativesReasoning}</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Suggest Alternatives
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useEffect } from 'react';
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
import { Loader2 } from 'lucide-react'; 


type AlternativeSuggestionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onSuggest: (subscriptionId: string) => Promise<void>; 
  isLoading: boolean;
};

export default function AlternativeSuggestionModal({
  isOpen,
  onClose,
  subscription,
  onSuggest,
  isLoading,
}: AlternativeSuggestionModalProps) {

  useEffect(() => {
    // No specific actions needed on open related to internal state for now
  }, [isOpen, subscription]);

  const handleSubmit = async () => {
    await onSuggest(subscription.id); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Find Alternatives for {subscription.vendor}</DialogTitle>
          <DialogDescription>
            Current cost: ${subscription.amount.toFixed(2)} / {subscription.frequency}.
            We&apos;ll find alternatives based on common uses for this subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
           {subscription.alternatives && subscription.alternatives.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-sm">Suggested Alternatives:</h4>
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

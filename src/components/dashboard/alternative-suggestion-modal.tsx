
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
// Label and Textarea are removed as userNeeds input is removed
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react'; // AlertTriangle removed as userNeeds validation is gone
// import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Alert components removed

type AlternativeSuggestionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onSuggest: (subscriptionId: string) => Promise<void>; // userNeeds removed from signature
  isLoading: boolean;
};

export default function AlternativeSuggestionModal({
  isOpen,
  onClose,
  subscription,
  onSuggest,
  isLoading,
}: AlternativeSuggestionModalProps) {
  // userNeeds state and related error state are removed
  // const [userNeeds, setUserNeeds] = useState(subscription.userNeeds || '');
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // setUserNeeds(subscription.userNeeds || ''); // No longer needed
      // setError(null); // No longer needed
    }
  }, [isOpen, subscription]);

  const handleSubmit = async () => {
    // Validation for userNeeds is removed
    // setError(null); // No longer needed if error state is removed
    await onSuggest(subscription.id); // userNeeds removed from call
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
          {/* Error display related to userNeeds removed */}
          {/* Textarea and Label for userNeeds removed */}
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

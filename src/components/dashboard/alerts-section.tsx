'use client';

import type { Subscription } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TriangleAlert } from 'lucide-react';
// differenceInDays and parseISO are no longer needed for the primary logic

type AlertsSectionProps = {
  subscriptions: Subscription[];
};

// UNUSED_THRESHOLD_DAYS is no longer the primary driver for alerts based on usage_count

export default function AlertsSection({ subscriptions }: AlertsSectionProps) {
  // Alert if AI detected usage_count is 0
  const aiDetectedUnusedSubscriptions = subscriptions.filter(sub => sub.usage_count === 0 && !sub.isUnused);

  // Alert if user marked as unused for a while (example: more than 7 days)
  // This part is optional, focusing on AI first as per new requirement.
  // For now, we only alert on AI detected (usage_count === 0)
  // const userMarkedUnusedLongTime = subscriptions.filter(sub => {
  //   if (sub.isUnused && sub.unusedSince) {
  //     try {
  //       const unusedDuration = differenceInDays(new Date(), parseISO(sub.unusedSince));
  //       return unusedDuration > 7; // Example: alert if user marked unused for over a week
  //     } catch (error) {
  //       return false;
  //     }
  //   }
  //   return false;
  // });

  const alertableSubscriptions = aiDetectedUnusedSubscriptions;


  if (alertableSubscriptions.length === 0) {
    return null; 
  }

  return (
    <div className="space-y-4">
      {alertableSubscriptions.map(sub => (
        <Alert key={`${sub.id}-ai-alert`} variant="default" className="border-accent bg-accent/10 shadow-md">
          <TriangleAlert className="h-5 w-5 text-accent" />
          <AlertTitle className="font-semibold text-accent-foreground">
            Potential Savings Opportunity!
          </AlertTitle>
          <AlertDescription className="text-accent-foreground/80">
            Our AI suggests your subscription for "{sub.vendor}" (costing ${sub.amount.toFixed(2)}/{sub.frequency}) 
            might be unused (usage count: {sub.usage_count ?? 'N/A'}).
            Consider reviewing or canceling it to save money.
             <div className="mt-2">
              {/* This button could link to the subscription details or a review action */}
              <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/20">
                Review Subscription
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
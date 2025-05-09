'use client';

import type { Subscription } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BellRing, TriangleAlert } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

type AlertsSectionProps = {
  subscriptions: Subscription[];
};

const UNUSED_THRESHOLD_DAYS = 30;

export default function AlertsSection({ subscriptions }: AlertsSectionProps) {
  const unusedSubscriptions = subscriptions.filter(sub => {
    if (sub.isUnused && sub.unusedSince) {
      try {
        const unusedDuration = differenceInDays(new Date(), parseISO(sub.unusedSince));
        return unusedDuration > UNUSED_THRESHOLD_DAYS;
      } catch (error) {
        // If parsing `unusedSince` fails, don't consider it for alerts.
        return false;
      }
    }
    return false;
  });

  if (unusedSubscriptions.length === 0) {
    return null; // Don't render anything if no alerts
  }

  return (
    <div className="space-y-4">
      {unusedSubscriptions.map(sub => (
        <Alert key={sub.id} variant="default" className="border-accent bg-accent/10 shadow-md">
          <TriangleAlert className="h-5 w-5 text-accent" />
          <AlertTitle className="font-semibold text-accent-foreground">
            Potential Savings Opportunity!
          </AlertTitle>
          <AlertDescription className="text-accent-foreground/80">
            Your subscription for "{sub.subscriptionName}" (costing ${sub.amount.toFixed(2)}/{sub.frequency}) 
            has been marked as unused for over {UNUSED_THRESHOLD_DAYS} days.
            Consider reviewing or canceling it to save money.
             <div className="mt-2">
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

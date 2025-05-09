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
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import { format, parse } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PredictRenewalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  onPredict: (subscriptionId: string, lastPaymentDate: string, billingCycle: string) => Promise<void>;
  isLoading: boolean;
};

export default function PredictRenewalModal({
  isOpen,
  onClose,
  subscription,
  onPredict,
  isLoading,
}: PredictRenewalModalProps) {
  const [lastPaymentDate, setLastPaymentDate] = useState<Date | undefined>(
    subscription.lastPaymentDate ? parse(subscription.lastPaymentDate, 'yyyy-MM-dd', new Date()) : undefined
  );
  const [billingCycle, setBillingCycle] = useState<string>(subscription.billingCycle || 'monthly');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      setLastPaymentDate(subscription.lastPaymentDate ? parse(subscription.lastPaymentDate, 'yyyy-MM-dd', new Date()) : new Date());
      setBillingCycle(subscription.billingCycle || 'monthly');
      setError(null);
    }
  }, [isOpen, subscription]);


  const handleSubmit = async () => {
    if (!lastPaymentDate) {
      setError('Last payment date is required.');
      return;
    }
    if (!billingCycle) {
      setError('Billing cycle is required.');
      return;
    }
    setError(null);
    await onPredict(subscription.id, format(lastPaymentDate, 'yyyy-MM-dd'), billingCycle);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Predict Renewal for {subscription.subscriptionName}</DialogTitle>
          <DialogDescription>
            Provide the last payment date and billing cycle to predict the next renewal.
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lastPaymentDate" className="text-right col-span-1">
              Last Payment
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`col-span-3 justify-start text-left font-normal ${!lastPaymentDate && "text-muted-foreground"}`}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastPaymentDate ? format(lastPaymentDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={lastPaymentDate}
                  onSelect={setLastPaymentDate}
                  initialFocus
                  disabled={isLoading}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="billingCycle" className="text-right col-span-1">
              Billing Cycle
            </Label>
            <Select value={billingCycle} onValueChange={setBillingCycle} disabled={isLoading}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select billing cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
                <SelectItem value="biannually">Biannually (Twice a Year)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Predict Renewal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

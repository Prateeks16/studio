'use client';

import { useState } from 'react';
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

type ChargeDetectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDetect: (bankData: string) => Promise<void>;
  isLoading: boolean;
};

export default function ChargeDetectionModal({ isOpen, onClose, onDetect, isLoading }: ChargeDetectionModalProps) {
  const [bankData, setBankData] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!bankData.trim()) {
      setError('Bank data cannot be empty.');
      return;
    }
    if (bankData.trim().length < 50) {
      setError('Please provide more detailed bank data (at least 50 characters).');
      return;
    }
    setError(null);
    await onDetect(bankData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Detect Recurring Charges</DialogTitle>
          <DialogDescription>
            Paste your bank transaction data below. Our AI will analyze it to identify recurring subscriptions.
            Please ensure data is anonymized and does not contain sensitive personal information beyond transaction descriptions and amounts.
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
            <Label htmlFor="bankData" className="text-left">
              Bank Transaction Data
            </Label>
            <Textarea
              id="bankData"
              value={bankData}
              onChange={(e) => setBankData(e.target.value)}
              placeholder="Example: Netflix - $15.99, Spotify Premium - $9.99, Amazon Prime - $14.99/month..."
              className="col-span-3 min-h-[150px] focus:ring-primary"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary hover:bg-primary/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Detect Charges
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

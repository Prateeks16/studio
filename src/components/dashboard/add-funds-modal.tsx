
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, IndianRupee, CreditCard, Landmark, Smartphone } from 'lucide-react'; // Replaced DollarSign with IndianRupee

type AddFundsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds: (amount: number) => Promise<void>;
  isLoading: boolean;
};

const paymentMethods = [
  { id: 'upi', name: 'UPI', icon: <Smartphone className="h-5 w-5 mr-2" /> },
  { id: 'netbanking', name: 'Internet Banking', icon: <Landmark className="h-5 w-5 mr-2" /> },
  { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard className="h-5 w-5 mr-2" /> },
];

export default function AddFundsModal({ isOpen, onClose, onAddFunds, isLoading }: AddFundsModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(paymentMethods[0].id);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      await onAddFunds(numericAmount);
      setAmount(''); 
    } else {
      // Consider using toast for better UX
      alert("Please enter a valid positive amount.");
    }
  };
  
  const formatCurrencyForDisplay = (value: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      return 'Funds';
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numericValue);
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Funds to Wallet</DialogTitle>
            <DialogDescription>
              Enter amount and select a payment method.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (INR)
              </Label>
              <div className="relative">
                 <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 1000.00"
                  className="pl-8 text-lg"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Select Payment Method</Label>
              <RadioGroup 
                value={selectedPaymentMethod} 
                onValueChange={setSelectedPaymentMethod}
                className="gap-3"
              >
                {paymentMethods.map((method) => (
                  <Label
                    key={method.id}
                    htmlFor={method.id}
                    className={`flex items-center space-x-3 rounded-md border p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors
                                ${selectedPaymentMethod === method.id ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border'}`}
                  >
                    <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                    {method.icon}
                    <span className="font-medium">{method.name}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {selectedPaymentMethod === 'card' && (
              <div className="space-y-4 p-4 border rounded-md bg-secondary/50">
                <p className="text-sm font-medium text-center text-muted-foreground">Enter Card Details (Mock Interface)</p>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" placeholder="•••• •••• •••• ••••" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input id="expiryDate" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="•••" />
                  </div>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="cardHolderName">Card Holder Name</Label>
                  <Input id="cardHolderName" placeholder="John Doe" />
                </div>
              </div>
            )}
             {selectedPaymentMethod === 'upi' && (
              <div className="space-y-3 p-4 border rounded-md bg-secondary/50">
                <p className="text-sm font-medium text-center text-muted-foreground">Enter UPI ID (Mock Interface)</p>
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input id="upiId" placeholder="yourname@bank" />
                </div>
                <Button variant="outline" className="w-full" type="button" disabled>Verify UPI ID</Button>
              </div>
            )}
            {selectedPaymentMethod === 'netbanking' && (
              <div className="space-y-3 p-4 border rounded-md bg-secondary/50">
                 <p className="text-sm font-medium text-center text-muted-foreground">Select Bank (Mock Interface)</p>
                <div className="space-y-2">
                  <Label htmlFor="bankSelect">Bank Name</Label>
                   <select id="bankSelect" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <option>Select Bank...</option>
                        <option>Mock Bank A</option>
                        <option>Mock Bank B</option>
                        <option>Mock Bank C</option>
                   </select>
                </div>
                <Button variant="outline" className="w-full" type="button" disabled>Proceed to Bank Portal</Button>
              </div>
            )}


          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} type="button" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !amount || parseFloat(amount) <= 0} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4" />}
              Add {formatCurrencyForDisplay(amount)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

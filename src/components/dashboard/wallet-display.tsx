
'use client';

import type { Wallet } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, PlusCircle } from 'lucide-react';

type WalletDisplayProps = {
  wallet: Wallet | null | undefined;
  onAddFundsClick: () => void;
};

export default function WalletDisplay({ wallet, onAddFundsClick }: WalletDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">My Wallet</CardTitle>
        <DollarSign className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">
          {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Your current available balance.
        </CardDescription>
        <Button onClick={onAddFundsClick} className="mt-4 w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Funds
        </Button>
      </CardContent>
    </Card>
  );
}


'use client';

import type { Transaction } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ArrowDownCircle, ArrowUpCircle, CircleSlash, Info, IndianRupee } from 'lucide-react'; // Added IndianRupee

type TransactionHistoryListProps = {
  transactions: Transaction[];
};

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'add_funds':
      return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
    case 'charge_success':
      return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
    case 'charge_failed':
      return <CircleSlash className="h-5 w-5 text-orange-500" />;
    case 'status_change':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
};

const getTransactionBadgeVariant = (type: Transaction['type']): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case 'add_funds':
      return 'default'; 
    case 'charge_success':
      return 'destructive';
    case 'charge_failed':
      return 'secondary'; 
    case 'status_change':
      return 'outline'; 
    default:
      return 'secondary';
  }
}

export default function TransactionHistoryList({ transactions }: TransactionHistoryListProps) {
  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return '';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy, HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Recent activity in your wallet.</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No transactions yet.</p>
        ) : (
          <ScrollArea className="h-[300px]">
            <ul className="space-y-3">
              {transactions.map((txn) => (
                <li key={txn.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(txn.type)}
                    <div>
                      <p className="font-medium text-sm">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(txn.timestamp)}</p>
                      {txn.relatedDetail && <p className="text-xs text-muted-foreground italic mt-0.5">{txn.relatedDetail}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    {txn.amount !== undefined && (
                      <p className={`text-sm font-semibold ${txn.type === 'add_funds' ? 'text-green-600' : (txn.type === 'charge_success' ? 'text-red-600' : 'text-foreground')}`}>
                        {txn.type === 'add_funds' ? '+' : (txn.type === 'charge_success' ? '-' : '')}{formatCurrency(txn.amount)}
                      </p>
                    )}
                     <Badge variant={getTransactionBadgeVariant(txn.type)} className="mt-1 capitalize text-xs">
                        {txn.type.replace('_', ' ')}
                     </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

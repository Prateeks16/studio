
'use client';

import type { Subscription, SubscriptionStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2, AlertCircle, PlayCircle, PauseCircle } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type SubscriptionsListProps = {
  subscriptions: Subscription[];
  onToggleUnused: (subscriptionId: string) => void; 
  onRenewSubscription: (subscriptionId: string) => void;
  onChargeSubscription: (subscription: Subscription) => void;
  onToggleSubscriptionStatus: (subscriptionId: string, newStatus: SubscriptionStatus) => void;
  isProcessingAction: boolean;
  isLoading: boolean;
};

export default function SubscriptionsList({
  subscriptions,
  onToggleUnused,
  onRenewSubscription,
  onChargeSubscription,
  onToggleSubscriptionStatus,
  isProcessingAction,
  isLoading
}: SubscriptionsListProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      if (isValid(parsedDate)) {
        return format(parsedDate, 'MMM d, yyyy');
      }
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const directDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (isValid(directDate)) return format(directDate, 'MMM d, yyyy');
      }
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading && subscriptions.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Loading Subscriptions...</CardTitle>
          <CardDescription>Please wait while we analyze your subscription data.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Your Subscriptions</CardTitle>
        <CardDescription>
          Overview of your detected recurring charges and their status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Controls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id} className={isProcessingAction ? 'opacity-50 pointer-events-none' : ''}>
                  <TableCell className="font-medium">{sub.vendor}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sub.amount)}</TableCell>
                  <TableCell>{sub.frequency}</TableCell>
                  <TableCell>
                    {sub.next_due_date ? (
                       <Badge variant="secondary">
                         {formatDateSafe(sub.next_due_date)}
                       </Badge>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant={sub.status === 'active' ? 'default' : 'outline'} 
                          className={`${sub.status === 'active' ? 'bg-green-500 hover:bg-green-600 text-white' : 'border-orange-500 text-orange-500'} cursor-help capitalize`}
                        >
                          {sub.status === 'paused' && <PauseCircle className="h-3 w-3 mr-1" />}
                          {sub.status === 'active' && <PlayCircle className="h-3 w-3 mr-1" />}
                           {sub.status}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current status: {sub.status}.</p>
                        {sub.isUnused && <p>AI detected low usage (usage: {sub.usage_count ?? 'N/A'}).</p>}
                      </TooltipContent>
                    </Tooltip>
                     {sub.isUnused && sub.status === 'active' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="destructive" className="cursor-help ml-1">
                                    <AlertCircle className="h-3 w-3 mr-1" /> Low Usage
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>AI suggests this subscription might be unused (usage: {sub.usage_count ?? 0}).</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {sub.status === 'active' ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => onToggleSubscriptionStatus(sub.id, 'paused')}
                            disabled={isProcessingAction}
                            aria-label="Pause Subscription"
                          >
                            {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Pause Subscription</TooltipContent>
                      </Tooltip>
                    ) : (
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => onToggleSubscriptionStatus(sub.id, 'active')}
                            disabled={isProcessingAction}
                            aria-label="Activate Subscription"
                          >
                            {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Activate Subscription</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => onRenewSubscription(sub.id)}
                          disabled={isProcessingAction}
                          className="text-primary hover:bg-primary/10 hover:text-primary"
                          aria-label="Renew Subscription"
                        >
                          {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Renew Subscription</TooltipContent> 
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

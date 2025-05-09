'use client';

import type { Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Archive, ArchiveRestore, Trash2, MoreVertical, Loader2, AlertCircle } from 'lucide-react'; // CalendarClock removed
import { format, parseISO, isValid } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type SubscriptionsListProps = {
  subscriptions: Subscription[];
  // onPredictRenewal is removed
  onSuggestAlternatives: (subscription: Subscription) => void;
  onToggleUnused: (subscriptionId: string) => void;
  onDeleteSubscription: (subscriptionId: string) => void;
  isLoading: boolean;
};

export default function SubscriptionsList({
  subscriptions,
  onSuggestAlternatives,
  onToggleUnused,
  onDeleteSubscription,
  isLoading
}: SubscriptionsListProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      if (isValid(parsedDate)) {
        return format(parsedDate, 'MMM d, yyyy');
      }
      // Try parsing YYYY-MM-DD if ISO parse fails
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const directDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (isValid(directDate)) {
          return format(directDate, 'MMM d, yyyy');
        }
      }
      return dateString; // Fallback
    } catch (error) {
      return dateString; // Fallback
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
                <TableHead>Last Payment</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium">{sub.vendor}</TableCell>
                  <TableCell className="text-right">{formatCurrency(sub.amount)}</TableCell>
                  <TableCell>{sub.frequency}</TableCell>
                  <TableCell>{formatDateSafe(sub.last_payment_date)}</TableCell>
                  <TableCell>
                    {sub.next_due_date ? (
                       <Badge variant="secondary">
                         {formatDateSafe(sub.next_due_date)}
                       </Badge>
                    ) : (
                      'N/A' 
                    )}
                  </TableCell>
                  <TableCell>
                    {sub.isUnused ? ( // User toggled or AI detected usage_count === 0
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Badge variant="destructive" className="cursor-help">
                            <AlertCircle className="h-3 w-3 mr-1" /> Unused
                           </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{sub.usage_count === 0 ? "AI detected as unused (usage: 0)." : "Marked as unused by user."}</p>
                          {sub.unusedSince && <p>Marked on: {formatDateSafe(sub.unusedSince)}</p>}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                       <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSuggestAlternatives(sub)}>
                          <Lightbulb className="mr-2 h-4 w-4" /> Find Alternatives
                        </DropdownMenuItem>
                        {/* Predict Renewal option removed */}
                        <DropdownMenuItem onClick={() => onToggleUnused(sub.id)}>
                          {sub.isUnused ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                          {sub.isUnused ? 'Mark as Active' : 'Mark as Unused'}
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onDeleteSubscription(sub.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
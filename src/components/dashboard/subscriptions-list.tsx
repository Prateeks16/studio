'use client';

import type { Subscription } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CalendarClock, Archive, ArchiveRestore, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SubscriptionsListProps = {
  subscriptions: Subscription[];
  onPredictRenewal: (subscription: Subscription) => void;
  onSuggestAlternatives: (subscription: Subscription) => void;
  onToggleUnused: (subscriptionId: string) => void;
  onDeleteSubscription: (subscriptionId: string) => void;
  isLoading: boolean;
};

export default function SubscriptionsList({
  subscriptions,
  onPredictRenewal,
  onSuggestAlternatives,
  onToggleUnused,
  onDeleteSubscription,
  isLoading
}: SubscriptionsListProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (error) {
      // Handle cases where dateString might not be a full ISO string, e.g. YYYY-MM-DD
      try {
        return format(new Date(dateString), 'MMM d, yyyy');
      } catch (innerError) {
        return dateString; // Fallback to original string if parsing fails
      }
    }
  };


  if (isLoading && subscriptions.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Loading Subscriptions...</CardTitle>
          <CardDescription>Please wait while we fetch your subscription data.</CardDescription>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Renewal Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.subscriptionName}</TableCell>
                <TableCell className="text-right">{formatCurrency(sub.amount)}</TableCell>
                <TableCell>{sub.frequency}</TableCell>
                <TableCell>
                  {sub.predictedRenewalDate ? (
                     <Badge variant={sub.renewalConfidence && sub.renewalConfidence < 0.7 ? "outline" : "secondary"}>
                       {formatDate(sub.predictedRenewalDate)}
                       {sub.renewalConfidence && ` (${(sub.renewalConfidence * 100).toFixed(0)}%)`}
                     </Badge>
                  ) : (
                    <Button variant="link" size="sm" onClick={() => onPredictRenewal(sub)} className="p-0 h-auto text-primary">
                      Predict
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {sub.isUnused ? (
                    <Badge variant="destructive">Unused</Badge>
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
                      {!sub.predictedRenewalDate && (
                        <DropdownMenuItem onClick={() => onPredictRenewal(sub)}>
                          <CalendarClock className="mr-2 h-4 w-4" /> Predict Renewal
                        </DropdownMenuItem>
                      )}
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
      </CardContent>
    </Card>
  );
}


'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChartHorizontalBig, AlertTriangle } from 'lucide-react';
import type { Subscription, Transaction } from '@/types';
import { getSubscriptionsFromStorage, getTransactionsFromStorage } from '@/lib/localStorageUtils';
import TotalMonthlySpendChart from '@/components/analytics/total-monthly-spend-chart';
import SpendByCategoryChart from '@/components/analytics/spend-by-category-chart';
import SubscriptionStatusTrendsChart from '@/components/analytics/subscription-status-trends-chart';

export default function AnalyticsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedSubscriptions = getSubscriptionsFromStorage();
      const storedTransactions = getTransactionsFromStorage();
      setSubscriptions(storedSubscriptions);
      setTransactions(storedTransactions);
    } catch (e) {
      console.error("Error fetching data for analytics:", e);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    const handleDataUpdate = () => fetchData();
    window.addEventListener('payright-subscriptions-updated', handleDataUpdate);
    window.addEventListener('payright-transactions-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('payright-subscriptions-updated', handleDataUpdate);
      window.removeEventListener('payright-transactions-updated', handleDataUpdate);
    };
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg border-destructive bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-6 w-6 mr-2" /> Error Loading Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <BarChartHorizontalBig className="h-8 w-8 text-primary mr-3" />
            <CardTitle className="text-2xl font-bold tracking-tight">Subscription Analytics</CardTitle>
          </div>
          <CardDescription>
            Visualize your subscription spending, categories, and activity trends.
          </CardDescription>
        </CardHeader>
      </Card>

      {subscriptions.length === 0 && transactions.length === 0 && (
         <Card className="shadow-lg">
            <CardContent className="p-10 text-center">
                <BarChartHorizontalBig className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">No Data Available</p>
                <p className="text-sm text-muted-foreground">
                    Sync your bank data on the Dashboard to see analytics.
                </p>
            </CardContent>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        {subscriptions.length > 0 && (
          <TotalMonthlySpendChart subscriptions={subscriptions} />
        )}
        
        {subscriptions.length > 0 && (
          <SpendByCategoryChart subscriptions={subscriptions} />
        )}
      </div>
      
      {transactions.length > 0 && (
         <SubscriptionStatusTrendsChart transactions={transactions} />
      )}
    </div>
  );
}

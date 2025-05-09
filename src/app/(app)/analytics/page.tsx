
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChartHorizontalBig, AlertTriangle, PieChart, TrendingUp } from 'lucide-react';
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
        <p className="text-lg text-muted-foreground">Loading financial insights...</p>
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
          <Button onClick={fetchData} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card className="shadow-xl bg-gradient-to-r from-primary/10 via-background to-background">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary rounded-full">
              <BarChartHorizontalBig className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Financial Insights & Trends</CardTitle>
              <CardDescription className="mt-1 text-base text-muted-foreground">
                Explore your subscription spending patterns, category breakdowns, and activity over time.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {(subscriptions.length === 0 && transactions.length === 0) && (
         <Card className="shadow-lg border-2 border-dashed border-muted">
            <CardContent className="p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="flex space-x-4 text-muted-foreground">
                    <PieChart className="h-16 w-16 opacity-50" />
                    <TrendingUp className="h-16 w-16 opacity-50" />
                </div>
                <p className="text-xl font-semibold text-muted-foreground">No Analytics Data Yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                    It looks like there's no subscription or transaction data to analyze. 
                    Please sync your bank data or email on the Dashboard page to populate your financial insights.
                </p>
                <Button variant="outline" onClick={() => window.location.href='/dashboard'}>Go to Dashboard</Button>
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
      
      {transactions.length > 0 && ( // This chart should be full-width if it's the only one in a row or on its own
         <div className="grid gap-8 md:grid-cols-1">
            <SubscriptionStatusTrendsChart transactions={transactions} />
         </div>
      )}
    </div>
  );
}

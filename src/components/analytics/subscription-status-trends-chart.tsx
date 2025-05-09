
'use client';

import React from 'react';
import type { Transaction } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';
import { format, parseISO, startOfMonth } from 'date-fns';

type SubscriptionStatusTrendsChartProps = {
  transactions: Transaction[];
};

const chartConfig = {
  activations: {
    label: 'Activations',
    color: 'hsl(var(--chart-2))', 
  },
  pauses: {
    label: 'Pauses',
    color: 'hsl(var(--chart-5))', 
  },
} satisfies ChartConfig;

const SubscriptionStatusTrendsChart: React.FC<SubscriptionStatusTrendsChartProps> = ({ transactions }) => {
  const statusChangeTransactions = transactions.filter(txn => txn.type === 'status_change');

  const trendsData = statusChangeTransactions.reduce((acc, txn) => {
    try {
      const month = format(startOfMonth(parseISO(txn.timestamp)), 'yyyy-MM');
      if (!acc[month]) {
        acc[month] = { month, activations: 0, pauses: 0 };
      }
      if (txn.relatedDetail?.toLowerCase().includes('active')) {
        acc[month].activations += 1;
      } else if (txn.relatedDetail?.toLowerCase().includes('paused')) {
        acc[month].pauses += 1;
      }
    } catch (e) {
      console.error("Error processing transaction for trends:", txn, e);
    }
    return acc;
  }, {} as Record<string, { month: string; activations: number; pauses: number }>);

  const chartData = Object.values(trendsData).sort((a, b) => a.month.localeCompare(b.month));

  const displayData = chartData.slice(-12);


  if (displayData.length === 0) {
    return (
      <Card className="shadow-lg border border-border/50">
        <CardHeader>
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-primary mr-3" />
            <CardTitle className="text-xl font-semibold">Subscription Activity Over Time</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground text-center">No subscription status changes recorded to display trends.</p>
        </CardContent>
      </Card>
    );
  }
  
  const formatMonthForAxis = (monthString: string) => {
      try {
          return format(parseISO(monthString), 'MMM yyyy');
      } catch {
          return monthString;
      }
  }

  return (
    <Card className="shadow-lg border border-border/50">
      <CardHeader>
        <div className="flex items-center">
          <Activity className="h-6 w-6 text-primary mr-3" />
          <CardTitle className="text-xl font-semibold">Subscription Activity Over Time</CardTitle>
        </div>
        <CardDescription className="mt-1">
          Track the monthly trends of subscription activations and pauses to understand your subscription lifecycle. This chart shows changes based on recorded transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full aspect-auto sm:aspect-[2/1] lg:aspect-[3/1]">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonthForAxis}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Count of Changes', angle: -90, position: 'insideLeft', offset:0, style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--foreground))' } }}
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--secondary))' }}
                content={<ChartTooltipContent />}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="activations" fill="var(--color-activations)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pauses" fill="var(--color-pauses)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
         <p className="text-xs text-muted-foreground mt-4 text-center">
            * Shows trends for the last {displayData.length} months with recorded status changes.
        </p>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusTrendsChart;

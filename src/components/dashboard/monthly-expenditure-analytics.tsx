
'use client';

import React from 'react';
import type { Subscription } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';

type MonthlyExpenditureAnalyticsProps = {
  subscriptions: Subscription[];
};

const chartConfig = {
  normalizedMonthlyCost: {
    label: 'Monthly Cost (USD)',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


const MonthlyExpenditureAnalytics: React.FC<MonthlyExpenditureAnalyticsProps> = ({ subscriptions }) => {
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

  const calculateNormalizedMonthlyCost = (subscription: Subscription): number => {
    const amount = Number(subscription.amount);
    if (isNaN(amount)) return 0;

    const frequency = subscription.frequency.toLowerCase();
    if (frequency === 'monthly') {
      return amount;
    }
    if (frequency === 'yearly') {
      return amount / 12;
    }
    // Add other frequency normalizations here if needed (e.g., quarterly, weekly)
    // For now, only monthly and yearly are explicitly normalized for the total.
    // Subscriptions with other frequencies won't contribute to the total monthly sum.
    return 0; 
  };
  
  const chartData = activeSubscriptions
    .map(sub => {
        const normalizedCost = calculateNormalizedMonthlyCost(sub);
        // Only include subscriptions that have a valid normalized monthly cost for the chart
        return normalizedCost > 0 ? { 
            name: sub.vendor, 
            normalizedMonthlyCost: parseFloat(normalizedCost.toFixed(2)) 
        } : null;
    })
    .filter(item => item !== null) as { name: string; normalizedMonthlyCost: number }[];


  const totalMonthlyExpenditure = chartData.reduce((sum, item) => sum + item.normalizedMonthlyCost, 0);

  if (activeSubscriptions.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-primary mr-3" />
            <CardTitle className="text-xl font-semibold">Monthly Expenditure</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No active subscriptions to analyze.</p>
        </CardContent>
      </Card>
    );
  }
  
  const formatCurrencyForAxis = (tickItem: number) => `$${tickItem.toFixed(0)}`;


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-primary mr-3" />
                <CardTitle className="text-xl font-semibold">Monthly Expenditure Analysis</CardTitle>
            </div>
            <div className="flex items-center text-right">
                 <DollarSign className="h-7 w-7 text-green-500 mr-1" />
                 <div>
                    <p className="text-2xl font-bold text-green-600">
                        ${totalMonthlyExpenditure.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Estimated Monthly Cost</p>
                 </div>
            </div>
        </div>
        <CardDescription>
          Breakdown of your estimated monthly spending on active subscriptions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full aspect-auto sm:aspect-[2/1] lg:aspect-[3/1]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    interval={0}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                    tickFormatter={formatCurrencyForAxis}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Normalized Monthly Cost (USD)', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--foreground))' } }}
                />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--secondary))' }}
                    content={<ChartTooltipContent 
                        formatter={(value) => `$${Number(value).toFixed(2)}`} 
                        nameKey="name" 
                        labelKey="name" 
                    />}
                />
                <Legend 
                  payload={[{ value: 'Monthly Cost (USD)', type: 'square', id: 'ID01', color: 'hsl(var(--chart-1))' }]}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                />
                <Bar dataKey="normalizedMonthlyCost" fill="var(--color-normalizedMonthlyCost)" radius={[4, 4, 0, 0]} barSize={chartData.length > 10 ? 20 : 40} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No subscriptions with 'monthly' or 'yearly' frequency found to display in the chart.
          </p>
        )}
         <p className="text-xs text-muted-foreground mt-4 text-center">
            * Chart displays subscriptions with 'monthly' or 'yearly' frequency, normalized to a monthly cost. Other frequencies are not included in this specific visualization or total.
        </p>
      </CardContent>
    </Card>
  );
};

export default MonthlyExpenditureAnalytics;

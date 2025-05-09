
'use client';

import React from 'react';
import type { Subscription } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { IndianRupee, TrendingUp } from 'lucide-react'; // Changed DollarSign to IndianRupee

type TotalMonthlySpendChartProps = {
  subscriptions: Subscription[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const chartConfig = {
  normalizedMonthlyCost: {
    label: 'Monthly Cost (INR)',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


const TotalMonthlySpendChart: React.FC<TotalMonthlySpendChartProps> = ({ subscriptions }) => {
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
    return 0; 
  };
  
  const chartData = activeSubscriptions
    .map(sub => {
        const normalizedCost = calculateNormalizedMonthlyCost(sub);
        return normalizedCost > 0 ? { 
            name: sub.vendor, 
            normalizedMonthlyCost: parseFloat(normalizedCost.toFixed(2)) 
        } : null;
    })
    .filter(item => item !== null) as { name: string; normalizedMonthlyCost: number }[];

  const totalMonthlyExpenditure = chartData.reduce((sum, item) => sum + item.normalizedMonthlyCost, 0);

  if (activeSubscriptions.length === 0) {
    return (
      <Card className="shadow-lg border border-border/50">
        <CardHeader>
          <div className="flex items-center">
            <TrendingUp className="h-6 w-6 text-primary mr-3" />
            <CardTitle className="text-xl font-semibold">Monthly Subscription Expenditure</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground text-center">No active subscriptions with monthly or yearly frequency to analyze for spend.</p>
        </CardContent>
      </Card>
    );
  }
  
  const formatCurrencyForAxis = (tickItem: number) => `₹${tickItem.toFixed(0)}`;

  return (
    <Card className="shadow-lg h-full flex flex-col border border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-primary mr-3" />
                <CardTitle className="text-xl font-semibold">Monthly Subscription Expenditure</CardTitle>
            </div>
            <div className="flex items-center text-right">
                 <IndianRupee className="h-7 w-7 text-green-500 mr-1" />
                 <div>
                    <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalMonthlyExpenditure)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Est. Monthly</p>
                 </div>
            </div>
        </div>
        <CardDescription className="mt-1">
          Detailed breakdown of estimated monthly costs for your active subscriptions. Yearly subscriptions are amortized to reflect monthly figures.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full aspect-auto sm:aspect-[2/1] lg:aspect-[3/1] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    interval={0}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                    tickFormatter={formatCurrencyForAxis}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    label={{ value: 'Normalized Monthly Cost (INR)', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--foreground))' } }}
                />
                <ChartTooltip
                    cursor={{ fill: 'hsl(var(--secondary))' }}
                    content={<ChartTooltipContent 
                        formatter={(value) => formatCurrency(Number(value))} 
                        nameKey="name" 
                        labelKey="name" 
                    />}
                />
                <Legend 
                  payload={[{ value: 'Monthly Cost (INR)', type: 'square', id: 'ID01', color: 'hsl(var(--chart-1))' }]}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                  verticalAlign="top" 
                  align="right"
                />
                <Bar dataKey="normalizedMonthlyCost" fill="var(--color-normalizedMonthlyCost)" radius={[4, 4, 0, 0]} barSize={chartData.length > 10 ? 20 : (chartData.length > 5 ? 30 : 40)} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center py-8">
                No subscriptions with 'monthly' or 'yearly' frequency found to display in the chart.
            </p>
          </div>
        )}
         <p className="text-xs text-muted-foreground mt-4 text-center">
            * Chart displays subscriptions with 'monthly' or 'yearly' frequency, normalized to a monthly cost.
        </p>
      </CardContent>
    </Card>
  );
};

export default TotalMonthlySpendChart;

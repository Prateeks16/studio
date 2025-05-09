
'use client';

import React from 'react';
import type { Subscription } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Package, Palette, IndianRupee } from 'lucide-react'; // Added IndianRupee

type SpendByCategoryChartProps = {
  subscriptions: Subscription[];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const categoryColors: { [key: string]: string } = {
  Entertainment: 'hsl(var(--chart-1))',
  Utilities: 'hsl(var(--chart-2))',
  SaaS: 'hsl(var(--chart-3))',
  Productivity: 'hsl(var(--chart-4))',
  Finance: 'hsl(var(--chart-5))',
  'Health & Wellness': 'hsl(var(--chart-1))',
  Shopping: 'hsl(var(--chart-2))',
  Education: 'hsl(var(--chart-3))',
  Other: 'hsl(var(--muted))',
};


const SpendByCategoryChart: React.FC<SpendByCategoryChartProps> = ({ subscriptions }) => {
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

  const calculateNormalizedMonthlyCost = (subscription: Subscription): number => {
    const amount = Number(subscription.amount);
    if (isNaN(amount)) return 0;
    const frequency = subscription.frequency.toLowerCase();
    if (frequency === 'monthly') return amount;
    if (frequency === 'yearly') return amount / 12;
    return 0; 
  };

  const spendByCategory = activeSubscriptions.reduce((acc, sub) => {
    const category = sub.category || 'Other';
    const cost = calculateNormalizedMonthlyCost(sub);
    if (cost > 0) {
      acc[category] = (acc[category] || 0) + cost;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(spendByCategory)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.name] = {
      label: item.name,
      color: categoryColors[item.name] || categoryColors['Other'],
    };
    return acc;
  }, {} as ChartConfig);


  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg border border-border/50">
        <CardHeader>
          <div className="flex items-center">
            <Palette className="h-6 w-6 text-primary mr-3" />
            <CardTitle className="text-xl font-semibold">Subscription Spend by Category</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground text-center">No categorized spending data available from active subscriptions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg h-full flex flex-col border border-border/50">
      <CardHeader>
        <div className="flex items-center">
          <Palette className="h-6 w-6 text-primary mr-3" />
          <CardTitle className="text-xl font-semibold">Subscription Spend by Category</CardTitle>
        </div>
        <CardDescription className="mt-1">
          Visualize the distribution of your estimated monthly subscription costs across various service categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full max-w-md aspect-square">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                    hideLabel 
                    formatter={(value, name) => [formatCurrency(Number(value)), name]}
                    />} 
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  innerRadius="50%" 
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percentage = (percent * 100).toFixed(0);
                    if (parseInt(percentage) < 5) return null; 

                    return (
                      <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
                        {`${chartData[index].name.substring(0,10)}${chartData[index].name.length > 10 ? '...' : ''} (${percentage}%)`}
                      </text>
                    );
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || categoryColors['Other']} />
                  ))}
                </Pie>
                <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center" 
                    wrapperStyle={{ fontSize: '12px', marginTop: '20px' }}
                    iconSize={10}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
             <p className="text-muted-foreground text-center py-8">
              No data to display for category spending. Ensure subscriptions have categories and costs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpendByCategoryChart;

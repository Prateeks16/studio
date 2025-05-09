
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Subscription } from '@/types';
import { getSubscriptionsFromStorage } from '@/lib/localStorageUtils';
import { 
  Bell, 
  CalendarClock, 
  CalendarX2, 
  Lightbulb, 
  Info, 
  Loader2,
  TriangleAlert 
} from 'lucide-react';
import { format, differenceInDays, isBefore, isToday, parseISO, isValid } from 'date-fns';
import Link from 'next/link';

type NotificationCategory = 'due_soon' | 'past_due' | 'usage_alert' | 'status_update' | 'general_info';

interface NotificationItem {
  id: string;
  subscriptionId?: string;
  category: NotificationCategory;
  title: string;
  message: string;
  date?: string; // ISO string for sorting or display (e.g., due date)
  severity: 'info' | 'warning' | 'error' | 'success';
  icon: React.ReactNode; // Changed from React.ReactElement to React.ReactNode
  action?: {
    label: string;
    href: string;
  };
}

const DUE_SOON_DAYS_THRESHOLD = 7;

export default function NotificationsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscriptions = useCallback(() => {
    setIsLoading(true);
    const storedSubscriptions = getSubscriptionsFromStorage();
    setSubscriptions(storedSubscriptions);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    
    const handleSubscriptionsUpdated = () => fetchSubscriptions();
    window.addEventListener('payright-subscriptions-updated', handleSubscriptionsUpdated);
    return () => {
      window.removeEventListener('payright-subscriptions-updated', handleSubscriptionsUpdated);
    };
  }, [fetchSubscriptions]);

  const formatDateSafe = (dateString?: string, dateFormat: string = 'MMM d, yyyy') => {
    if (!dateString) return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      if (isValid(parsedDate)) {
        return format(parsedDate, dateFormat);
      }
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    if (isLoading) return;

    const generatedNotifications: NotificationItem[] = [];
    const today = new Date();

    subscriptions.forEach(sub => {
      // Past Due
      if (sub.next_due_date && sub.status === 'active') {
        const dueDate = parseISO(sub.next_due_date);
        if (isValid(dueDate) && isBefore(dueDate, today) && !isToday(dueDate)) {
          generatedNotifications.push({
            id: `${sub.id}-past-due`,
            subscriptionId: sub.id,
            category: 'past_due',
            title: `Past Due: ${sub.vendor}`,
            message: `Your subscription for ${sub.vendor} was due on ${formatDateSafe(sub.next_due_date)}. Please renew or manage it.`,
            date: sub.next_due_date,
            severity: 'error',
            icon: <CalendarX2 className="h-5 w-5 text-destructive" />,
            action: { label: 'Go to Dashboard', href: '/dashboard' },
          });
        }
      }

      // Due Soon
      if (sub.next_due_date && sub.status === 'active') {
        const dueDate = parseISO(sub.next_due_date);
        if (isValid(dueDate)) {
            const daysUntilDue = differenceInDays(dueDate, today);
            if (daysUntilDue >= 0 && daysUntilDue <= DUE_SOON_DAYS_THRESHOLD) {
            generatedNotifications.push({
                id: `${sub.id}-due-soon`,
                subscriptionId: sub.id,
                category: 'due_soon',
                title: `Upcoming: ${sub.vendor}`,
                message: `Your subscription for ${sub.vendor} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} on ${formatDateSafe(sub.next_due_date)}.`,
                date: sub.next_due_date,
                severity: 'warning',
                icon: <CalendarClock className="h-5 w-5 text-yellow-500" />, // using yellow for warning
                action: { label: 'Go to Dashboard', href: '/dashboard' },
            });
            }
        }
      }
      
      // AI Usage Alert
      if (sub.usage_count === 0 && sub.status === 'active') {
        generatedNotifications.push({
          id: `${sub.id}-usage-alert`,
          subscriptionId: sub.id,
          category: 'usage_alert',
          title: `Low Usage: ${sub.vendor}`,
          message: `AI suggests your subscription for ${sub.vendor} might be unused. Consider reviewing it.`,
          severity: 'info',
          icon: <Lightbulb className="h-5 w-5 text-primary" />,
          action: { label: 'Get Suggestions', href: '/ai-suggestions' },
        });
      }

      // Paused Subscription Info
      if (sub.status === 'paused') {
         generatedNotifications.push({
          id: `${sub.id}-status-paused`,
          subscriptionId: sub.id,
          category: 'status_update',
          title: `Paused: ${sub.vendor}`,
          message: `Your subscription for ${sub.vendor} is currently paused.`,
          severity: 'info',
          icon: <Info className="h-5 w-5 text-blue-500" />,
           action: { label: 'Go to Dashboard', href: '/dashboard' },
        });
      }
    });
    
    // Sort notifications: errors first, then warnings, then by date (most recent/relevant first)
    generatedNotifications.sort((a, b) => {
        if (a.severity === 'error' && b.severity !== 'error') return -1;
        if (b.severity === 'error' && a.severity !== 'error') return 1;
        if (a.severity === 'warning' && b.severity !== 'warning') return -1;
        if (b.severity === 'warning' && a.severity !== 'warning') return 1;
        if (a.date && b.date) return parseISO(a.date).getTime() - parseISO(b.date).getTime(); // earlier dates first
        if (a.date) return -1;
        if (b.date) return 1;
        return 0;
    });


    setNotifications(generatedNotifications);
  }, [subscriptions, isLoading]);

  const getAlertVariant = (severity: NotificationItem['severity']): "default" | "destructive" => {
    if (severity === 'error') return 'destructive';
    // Add more specific variants if shadcn/ui Alert supports them or customize CSS
    // For now, 'default' covers 'warning', 'info', 'success'
    return 'default';
  };
  
  const getIconColorClass = (severity: NotificationItem['severity']): string => {
    switch (severity) {
        case 'error': return 'text-destructive';
        case 'warning': return 'text-yellow-500'; // Custom color or use accent if theme fits
        case 'info': return 'text-blue-500'; // Custom color or use primary/secondary
        case 'success': return 'text-green-500'; // Custom color or use accent
        default: return 'text-foreground';
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center">
          <Bell className="h-6 w-6 text-primary mr-3" />
          <CardTitle className="text-xl font-semibold">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>
            Stay updated on your subscriptions, renewals, and potential savings.
          </CardDescription>
        </CardContent>
      </Card>

      {notifications.length === 0 && !isLoading && (
        <Card className="shadow-md">
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">All Clear!</p>
            <p className="text-muted-foreground">You have no new notifications at the moment.</p>
          </CardContent>
        </Card>
      )}

      {notifications.length > 0 && (
        <div className="space-y-4">
          {notifications.map(notification => (
            <Alert 
                key={notification.id} 
                variant={getAlertVariant(notification.severity)}
                className={`shadow-md ${notification.severity === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10' : ''} ${notification.severity === 'info' ? 'border-blue-500/50 bg-blue-500/10' : ''} ${notification.severity === 'success' ? 'border-green-500/50 bg-green-500/10' : ''}`}
            >
              <div className={`absolute left-4 top-4 ${getIconColorClass(notification.severity)}`}>
                 {React.cloneElement(notification.icon as React.ReactElement, { className: `h-5 w-5 ${getIconColorClass(notification.severity)}` })}
              </div>
              <AlertTitle className={`ml-8 ${getIconColorClass(notification.severity)}`}>{notification.title}</AlertTitle>
              <AlertDescription className="ml-8">
                {notification.message}
                {notification.date && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {notification.category === 'past_due' || notification.category === 'due_soon' ? 'Due: ' : ''}
                    {formatDateSafe(notification.date)}
                  </Badge>
                )}
                 {notification.action && (
                    <div className="mt-2">
                        <Link href={notification.action.href}>
                            <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                                {notification.action.label}
                            </Button>
                        </Link>
                    </div>
                 )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}

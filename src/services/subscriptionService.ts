
import type { Subscription, SubscriptionStatus, Transaction } from '@/types';
import { getSubscriptionsFromStorage, updateSubscriptionInStorage, saveTransactionToStorage } from '@/lib/localStorageUtils';

const MOCK_USER_ID = 'defaultUser';

export async function toggleSubscriptionStatus(
  userId: string = MOCK_USER_ID,
  subscriptionId: string,
  newStatus: SubscriptionStatus
): Promise<Subscription | null> {
  const subscriptions = getSubscriptionsFromStorage();
  const subIndex = subscriptions.findIndex(s => s.id === subscriptionId);

  if (subIndex === -1) {
    console.error(`Subscription with ID ${subscriptionId} not found.`);
    // Instead of returning null which can be hard to debug, throw an error or return an object indicating failure
    // For now, align with existing possible null return, but consider changing.
    return null; 
  }

  const subscription = subscriptions[subIndex];
  subscription.status = newStatus;
  updateSubscriptionInStorage(subscription);

  const transaction: Transaction = {
    id: `txn-status-${Date.now()}`,
    userId,
    type: 'status_change',
    description: `Subscription ${subscription.vendor} status changed to ${newStatus}.`,
    timestamp: new Date().toISOString(),
    subscriptionId: subscription.id,
    relatedDetail: `Status of ${subscription.vendor} set to ${newStatus}`
  };
  saveTransactionToStorage(transaction);

  return subscription;
}


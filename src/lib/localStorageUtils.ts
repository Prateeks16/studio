
import type { Wallet, Transaction, Subscription } from '@/types';

const MOCK_USER_ID = 'defaultUser';

// --- Wallet ---
const WALLETS_KEY = 'payright-wallets';

export const getWalletFromStorage = (userId: string = MOCK_USER_ID): Wallet => {
  if (typeof window === 'undefined') return { userId, balance: 0 };
  const walletsStr = localStorage.getItem(WALLETS_KEY);
  const wallets: Record<string, Wallet> = walletsStr ? JSON.parse(walletsStr) : {};
  return wallets[userId] || { userId, balance: 0 };
};

export const saveWalletToStorage = (wallet: Wallet): void => {
  if (typeof window === 'undefined') return;
  const walletsStr = localStorage.getItem(WALLETS_KEY);
  const wallets: Record<string, Wallet> = walletsStr ? JSON.parse(walletsStr) : {};
  wallets[wallet.userId] = wallet;
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
};

// --- Transactions ---
const TRANSACTIONS_KEY = 'payright-transactions';

export const getTransactionsFromStorage = (userId: string = MOCK_USER_ID): Transaction[] => {
  if (typeof window === 'undefined') return [];
  const transactionsStr = localStorage.getItem(TRANSACTIONS_KEY);
  const allTransactions: Record<string, Transaction[]> = transactionsStr ? JSON.parse(transactionsStr) : {};
  return allTransactions[userId] || [];
};

export const saveTransactionToStorage = (transaction: Transaction): void => {
  if (typeof window === 'undefined') return;
  const transactionsStr = localStorage.getItem(TRANSACTIONS_KEY);
  const allTransactions: Record<string, Transaction[]> = transactionsStr ? JSON.parse(transactionsStr) : {};
  if (!allTransactions[transaction.userId]) {
    allTransactions[transaction.userId] = [];
  }
  allTransactions[transaction.userId].unshift(transaction); // Add to the beginning
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(allTransactions));
};


// --- Subscriptions (augmenting existing usage) ---
const SUBSCRIPTIONS_KEY = 'payright-subscriptions';

export const getSubscriptionsFromStorage = (): Subscription[] => {
  if (typeof window === 'undefined') return [];
  const storedSubscriptions = localStorage.getItem(SUBSCRIPTIONS_KEY);
  if (storedSubscriptions) {
    try {
      const parsedSubs = JSON.parse(storedSubscriptions) as Subscription[];
      // Ensure all subscriptions have a status
      return parsedSubs.map(sub => ({ ...sub, status: sub.status || 'active' }));
    } catch (error) {
      console.error("Failed to parse subscriptions from localStorage", error);
      return [];
    }
  }
  return [];
};

export const saveSubscriptionsToStorage = (subscriptions: Subscription[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
};

export const updateSubscriptionInStorage = (updatedSubscription: Subscription): void => {
  if (typeof window === 'undefined') return;
  const subscriptions = getSubscriptionsFromStorage();
  const index = subscriptions.findIndex(s => s.id === updatedSubscription.id);
  if (index !== -1) {
    subscriptions[index] = updatedSubscription;
    saveSubscriptionsToStorage(subscriptions);
  }
};

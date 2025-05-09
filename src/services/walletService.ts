
import type { Wallet, Transaction, Subscription, TransactionType } from '@/types';
import { getWalletFromStorage, saveWalletToStorage, saveTransactionToStorage, getTransactionsFromStorage } from '@/lib/localStorageUtils';

const MOCK_USER_ID = 'defaultUser';

export async function getWallet(userId: string = MOCK_USER_ID): Promise<Wallet> {
  return getWalletFromStorage(userId);
}

export async function addFunds(userId: string = MOCK_USER_ID, amount: number): Promise<Wallet> {
  if (amount <= 0) {
    throw new Error("Amount must be positive.");
  }
  const wallet = getWalletFromStorage(userId);
  wallet.balance += amount;
  saveWalletToStorage(wallet);

  const transaction: Transaction = {
    id: `txn-${Date.now()}`,
    userId,
    type: 'add_funds',
    amount,
    description: `Added funds to wallet.`,
    timestamp: new Date().toISOString(),
  };
  saveTransactionToStorage(transaction);
  return wallet;
}

export async function chargeForSubscription(userId: string = MOCK_USER_ID, subscription: Subscription): Promise<{ success: boolean; newBalance: number; transaction: Transaction }> {
  const wallet = getWalletFromStorage(userId);
  let transactionType: TransactionType = 'charge_failed';
  let success = false;

  if (wallet.balance >= subscription.amount) {
    wallet.balance -= subscription.amount;
    saveWalletToStorage(wallet);
    transactionType = 'charge_success';
    success = true;
  }

  const transaction: Transaction = {
    id: `txn-${Date.now()}`,
    userId,
    type: transactionType,
    amount: subscription.amount,
    description: `${success ? 'Charged' : 'Failed to charge'} for ${subscription.vendor}.`,
    timestamp: new Date().toISOString(),
    subscriptionId: subscription.id,
    relatedDetail: `${success ? 'Payment successful' : 'Insufficient funds'} for ${subscription.vendor}`
  };
  saveTransactionToStorage(transaction);

  return { success, newBalance: wallet.balance, transaction };
}

export async function getTransactions(userId: string = MOCK_USER_ID): Promise<Transaction[]> {
  return getTransactionsFromStorage(userId);
}


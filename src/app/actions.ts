
'use server';

import { detectRecurringCharges, DetectRecurringChargesInput, DetectRecurringChargesOutput } from '@/ai/flows/detect-recurring-charges';
import { suggestSubscriptionAlternatives, SuggestSubscriptionAlternativesInput, SuggestSubscriptionAlternativesOutput } from '@/ai/flows/suggest-subscription-alternatives';
import { addFunds as addFundsService, chargeForSubscription as chargeForSubscriptionService, getWallet as getWalletService, getTransactions as getTransactionsService } from '@/services/walletService';
import { toggleSubscriptionStatus as toggleSubscriptionStatusService } from '@/services/subscriptionService';
import type { Wallet, Transaction, Subscription, SubscriptionStatus } from '@/types';
import { z } from 'zod';

const MOCK_USER_ID = 'defaultUser';

const DetectChargesSchema = z.object({
  bankData: z.string().min(10, "Bank data must be at least 10 characters long."),
});

const SuggestAlternativesSchema = z.object({
  subscriptionName: z.string().min(1, "Subscription name cannot be empty."),
  currentCost: z.number().positive("Current cost must be a positive number."),
});

const AddFundsSchema = z.object({
    amount: z.number().positive("Amount must be a positive number."),
});

const ChargeSubscriptionSchema = z.object({
    id: z.string().min(1),
    vendor: z.string().min(1),
    amount: z.number().positive(),
    frequency: z.string().min(1),
    last_payment_date: z.string(),
    next_due_date: z.string(),
    status: z.enum(['active', 'paused']),
});

const ToggleSubscriptionStatusSchema = z.object({
    subscriptionId: z.string().min(1),
    newStatus: z.enum(['active', 'paused']),
});


export async function handleDetectCharges(input: DetectRecurringChargesInput): Promise<DetectRecurringChargesOutput | { error: string }> {
  const validation = DetectChargesSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    const results = await detectRecurringCharges(input);
    // Initialize status to 'active' for newly detected subscriptions
    return results.map(charge => ({ ...charge, status: 'active' as SubscriptionStatus }));
  } catch (e) {
    console.error("Error in handleDetectCharges:", e);
    return { error: "Failed to detect charges. Please try again." };
  }
}

export async function handleSuggestAlternatives(input: SuggestSubscriptionAlternativesInput): Promise<SuggestSubscriptionAlternativesOutput | { error: string }> {
  const validation = SuggestAlternativesSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    return await suggestSubscriptionAlternatives(input);
  } catch (e) {
    console.error("Error in handleSuggestAlternatives:", e);
    return { error: "Failed to suggest alternatives. Please try again." };
  }
}

export async function handleAddFunds(formData: FormData): Promise<{ wallet?: Wallet; error?: string }> {
  const amount = Number(formData.get('amount'));
  const validation = AddFundsSchema.safeParse({ amount });

  if (!validation.success) {
    return { error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    const updatedWallet = await addFundsService(MOCK_USER_ID, validation.data.amount);
    return { wallet: updatedWallet };
  } catch (e: any) {
    console.error("Error in handleAddFunds:", e);
    return { error: e.message || "Failed to add funds." };
  }
}

export async function handleChargeSubscription(subscription: Subscription): Promise<{ success: boolean; newBalance?: number; transaction?: Transaction; error?: string }> {
  const validation = ChargeSubscriptionSchema.safeParse(subscription);
   if (!validation.success) {
    return { success: false, error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    return await chargeForSubscriptionService(MOCK_USER_ID, validation.data as Subscription);
  } catch (e: any) {
    console.error("Error in handleChargeSubscription:", e);
    return { success: false, error: e.message || "Failed to charge subscription." };
  }
}

export async function handleToggleSubscriptionStatus(subscriptionId: string, newStatus: SubscriptionStatus): Promise<{ subscription?: Subscription; error?: string }> {
  const validation = ToggleSubscriptionStatusSchema.safeParse({ subscriptionId, newStatus });
   if (!validation.success) {
    return { error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    const updatedSubscription = await toggleSubscriptionStatusService(MOCK_USER_ID, validation.data.subscriptionId, validation.data.newStatus);
    if (!updatedSubscription) {
        return { error: "Failed to update subscription status." };
    }
    return { subscription: updatedSubscription };
  } catch (e: any) {
    console.error("Error in handleToggleSubscriptionStatus:", e);
    return { error: e.message || "Failed to toggle subscription status." };
  }
}

export async function handleGetWalletAndTransactions(): Promise<{ wallet?: Wallet; transactions?: Transaction[]; error?: string }> {
  try {
    const wallet = await getWalletService(MOCK_USER_ID);
    const transactions = await getTransactionsService(MOCK_USER_ID);
    return { wallet, transactions };
  } catch (e: any) {
    console.error("Error in handleGetWalletAndTransactions:", e);
    return { error: e.message || "Failed to retrieve wallet information." };
  }
}

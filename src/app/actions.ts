
'use server';

import { detectRecurringCharges, DetectRecurringChargesInput, DetectRecurringChargesOutput } from '@/ai/flows/detect-recurring-charges';
import { suggestSubscriptionAlternatives, SuggestSubscriptionAlternativesInput, SuggestSubscriptionAlternativesOutput } from '@/ai/flows/suggest-subscription-alternatives';
// Services for wallet and subscription are now client-side, direct calls will be made from components.
// import { addFunds as addFundsService, chargeForSubscription as chargeForSubscriptionService, getWallet as getWalletService, getTransactions as getTransactionsService } from '@/services/walletService';
// import { toggleSubscriptionStatus as toggleSubscriptionStatusService } from '@/services/subscriptionService';
import type { SubscriptionStatus } from '@/types'; // Wallet, Transaction, Subscription types might still be useful for AI outputs if they align.
import { z } from 'zod';

// MOCK_USER_ID is not needed here anymore for wallet/subscription actions

const DetectChargesSchema = z.object({
  bankData: z.string().min(10, "Bank data must be at least 10 characters long."),
});

const SuggestAlternativesSchema = z.object({
  subscriptionName: z.string().min(1, "Subscription name cannot be empty."),
  currentCost: z.number().positive("Current cost must be a positive number."),
});

// Schemas for removed actions are no longer needed:
// const AddFundsSchema, ChargeSubscriptionSchema, ToggleSubscriptionStatusSchema


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
    const errorMessage = e instanceof Error ? e.message : "Failed to detect charges. Please try again.";
    return { error: errorMessage };
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
    const errorMessage = e instanceof Error ? e.message : "Failed to suggest alternatives. Please try again.";
    return { error: errorMessage };
  }
}

// Removed handleAddFunds
// Removed handleChargeSubscription
// Removed handleToggleSubscriptionStatus
// Removed handleGetWalletAndTransactions


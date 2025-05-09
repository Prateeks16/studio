
'use server';

import { detectRecurringCharges, DetectRecurringChargesInput, DetectRecurringChargesOutput } from '@/ai/flows/detect-recurring-charges';
// predictRenewalDates and related types are removed
import { suggestSubscriptionAlternatives, SuggestSubscriptionAlternativesInput, SuggestSubscriptionAlternativesOutput } from '@/ai/flows/suggest-subscription-alternatives';
import { z } from 'zod';

const DetectChargesSchema = z.object({
  bankData: z.string().min(10, "Bank data must be at least 10 characters long."),
});

// PredictRenewalSchema is removed

const SuggestAlternativesSchema = z.object({
  subscriptionName: z.string().min(1, "Subscription name cannot be empty."),
  currentCost: z.number().positive("Current cost must be a positive number."),
});

export async function handleDetectCharges(input: DetectRecurringChargesInput): Promise<DetectRecurringChargesOutput | { error: string }> {
  const validation = DetectChargesSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    return await detectRecurringCharges(input);
  } catch (e) {
    console.error("Error in handleDetectCharges:", e);
    return { error: "Failed to detect charges. Please try again." };
  }
}

// handlePredictRenewal function is removed

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

'use server';

import { detectRecurringCharges, DetectRecurringChargesInput, DetectRecurringChargesOutput } from '@/ai/flows/detect-recurring-charges';
import { predictRenewalDates, PredictRenewalDatesInput, PredictRenewalDatesOutput } from '@/ai/flows/predict-renewal-dates';
import { suggestSubscriptionAlternatives, SuggestSubscriptionAlternativesInput, SuggestSubscriptionAlternativesOutput } from '@/ai/flows/suggest-subscription-alternatives';
import { z } from 'zod';

const DetectChargesSchema = z.object({
  bankData: z.string().min(10, "Bank data must be at least 10 characters long."),
});

const PredictRenewalSchema = z.object({
  subscriptionName: z.string(),
  lastPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD."),
  billingCycle: z.string(),
});

const SuggestAlternativesSchema = z.object({
  subscriptionName: z.string(),
  userNeeds: z.string().min(5, "User needs must be at least 5 characters long."),
  currentCost: z.number(),
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

export async function handlePredictRenewal(input: PredictRenewalDatesInput): Promise<PredictRenewalDatesOutput | { error: string }> {
  const validation = PredictRenewalSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    return await predictRenewalDates(input);
  } catch (e) {
    console.error("Error in handlePredictRenewal:", e);
    return { error: "Failed to predict renewal date. Please try again." };
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

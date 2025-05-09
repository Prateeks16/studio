
'use server';

import { detectRecurringCharges, DetectRecurringChargesInput, DetectRecurringChargesOutput } from '@/ai/flows/detect-recurring-charges';
import { suggestSubscriptionAlternatives, SuggestSubscriptionAlternativesInput, SuggestSubscriptionAlternativesOutput } from '@/ai/flows/suggest-subscription-alternatives';
import type { SubscriptionStatus } from '@/types'; 
import { z } from 'zod';

const DetectChargesSchema = z.object({
  bankData: z.string().min(10, "Bank data must be at least 10 characters long."),
});

const SuggestAlternativesSchema = z.object({
  subscriptionName: z.string().min(1, "Subscription name cannot be empty."),
  currentCost: z.number().positive("Current cost must be a positive number."),
});


export async function handleDetectCharges(input: DetectRecurringChargesInput): Promise<DetectRecurringChargesOutput | { error: string }> {
  const validation = DetectChargesSchema.safeParse(input);
  if (!validation.success) {
    console.error("handleDetectCharges input validation error:", validation.error.errors);
    return { error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    const detectedChargesOutput = await detectRecurringCharges(input);
    // The flow itself should throw an error if something goes wrong internally,
    // which would be caught by the catch block below.
    // If it returns, it's the successful output.
    return detectedChargesOutput.map(charge => ({ ...charge, status: 'active' as SubscriptionStatus }));
  } catch (e) {
    console.error("Error in handleDetectCharges action:", e); 
    let errorMessage = "An unexpected error occurred on the server while detecting charges.";
    if (e instanceof Error) {
        errorMessage = e.message; 
    } else if (typeof e === 'string') {
        errorMessage = e;
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
        errorMessage = e.message;
    }
    return { error: `Failed to detect charges: ${errorMessage}` };
  }
}

export async function handleSuggestAlternatives(input: SuggestSubscriptionAlternativesInput): Promise<SuggestSubscriptionAlternativesOutput | { error: string }> {
  const validation = SuggestAlternativesSchema.safeParse(input);
  if (!validation.success) {
    console.error("handleSuggestAlternatives input validation error:", validation.error.errors);
    return { error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    const suggestionOutput = await suggestSubscriptionAlternatives(input);
    // The flow itself should throw an error if something goes wrong internally.
    return suggestionOutput;
  } catch (e) {
    console.error("Error in handleSuggestAlternatives action:", e);
    let errorMessage = "An unexpected error occurred on the server while suggesting alternatives.";
     if (e instanceof Error) {
        errorMessage = e.message;
    } else if (typeof e === 'string') {
        errorMessage = e;
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
        errorMessage = e.message;
    }
    return { error: `Failed to suggest alternatives: ${errorMessage}` };
  }
}


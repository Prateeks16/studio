
'use server';

import { detectRecurringCharges, DetectRecurringChargesInput, DetectRecurringChargesOutput } from '@/ai/flows/detect-recurring-charges';
import { suggestSubscriptionAlternatives, SuggestSubscriptionAlternativesInput, SuggestSubscriptionAlternativesOutput } from '@/ai/flows/suggest-subscription-alternatives';
import { detectChargesFromEmail, DetectChargesFromEmailInput } from '@/ai/flows/detect-charges-from-email'; // Re-uses DetectRecurringChargesOutput
import type { SubscriptionStatus } from '@/types'; 
import { z } from 'zod';

const DetectChargesSchema = z.object({
  bankData: z.string().min(10, "Bank data must be at least 10 characters long."),
});

const DetectChargesFromEmailSchema = z.object({
  emailContent: z.string().min(20, "Email content must be at least 20 characters long."),
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
    return detectedChargesOutput.map(charge => ({ ...charge, status: 'active' as SubscriptionStatus }));
  } catch (e) {
    console.error("Error in handleDetectCharges action:", e); 
    let errorMessage = "An unexpected error occurred on the server while detecting charges from bank data.";
    if (e instanceof Error) {
        errorMessage = e.message; 
    } else if (typeof e === 'string') {
        errorMessage = e;
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
        errorMessage = e.message;
    }
    return { error: `Failed to detect charges from bank data: ${errorMessage}` };
  }
}

export async function handleDetectChargesFromEmail(input: DetectChargesFromEmailInput): Promise<DetectRecurringChargesOutput | { error: string }> {
  const validation = DetectChargesFromEmailSchema.safeParse(input);
  if (!validation.success) {
    console.error("handleDetectChargesFromEmail input validation error:", validation.error.errors);
    return { error: validation.error.errors.map(e => e.message).join(', ') };
  }
  try {
    const detectedChargesOutput = await detectChargesFromEmail(input);
    // The flow itself should throw an error if something goes wrong internally.
    // Ensure status is added similar to the bank data flow.
    return detectedChargesOutput.map(charge => ({ ...charge, status: 'active' as SubscriptionStatus }));
  } catch (e) {
    console.error("Error in handleDetectChargesFromEmail action:", e);
    let errorMessage = "An unexpected error occurred on the server while detecting charges from email.";
    if (e instanceof Error) {
        errorMessage = e.message;
    } else if (typeof e === 'string') {
        errorMessage = e;
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
        errorMessage = e.message;
    }
    return { error: `Failed to detect charges from email: ${errorMessage}` };
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


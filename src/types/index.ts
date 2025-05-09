import type { DetectRecurringChargesOutput } from "@/ai/flows/detect-recurring-charges";
// PredictRenewalDatesOutput is no longer needed as predict-renewal-dates.ts is removed
import type { SuggestSubscriptionAlternativesOutput } from "@/ai/flows/suggest-subscription-alternatives";

export interface Subscription {
  id: string;
  vendor: string; // Changed from subscriptionName
  amount: number;
  frequency: string;
  last_payment_date: string; // From AI
  next_due_date: string; // From AI
  usage_count?: number; // From AI, 0 indicates potentially unused
  userNeeds?: string; // For alternative suggestions
  isUnused?: boolean; // User-toggleable, initially based on usage_count
  unusedSince?: string; // ISO date string, set when user marks as unused
  alternatives?: string[];
  alternativesReasoning?: string;
  // Fields below are potentially redundant or replaced by AI output
  // predictedRenewalDate?: string; // Replaced by next_due_date
  // renewalConfidence?: number; // No longer provided by this AI flow
  // lastPaymentDate?: string; // This was for user input, now coming from AI as last_payment_date
  billingCycle?: string; // User input for previous prediction, frequency is now the primary field
}

// Re-exporting AI types for convenience
export type {
  DetectRecurringChargesOutput,
  // PredictRenewalDatesOutput, // Removed
  SuggestSubscriptionAlternativesOutput
};
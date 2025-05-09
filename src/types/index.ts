import type { DetectRecurringChargesOutput } from "@/ai/flows/detect-recurring-charges";
import type { PredictRenewalDatesOutput } from "@/ai/flows/predict-renewal-dates";
import type { SuggestSubscriptionAlternativesOutput } from "@/ai/flows/suggest-subscription-alternatives";

export interface Subscription {
  id: string;
  subscriptionName: string;
  amount: number;
  frequency: string;
  predictedRenewalDate?: string;
  renewalConfidence?: number;
  lastPaymentDate?: string; // User input, crucial for renewal prediction
  billingCycle?: string; // User input or derived, e.g., "monthly", "yearly"
  userNeeds?: string;
  isUnused?: boolean;
  unusedSince?: string; // ISO date string
  alternatives?: string[];
  alternativesReasoning?: string;
}

// Re-exporting AI types for convenience if needed, or components can import directly
export type {
  DetectRecurringChargesOutput,
  PredictRenewalDatesOutput,
  SuggestSubscriptionAlternativesOutput
};

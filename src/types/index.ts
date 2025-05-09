
import type { SuggestSubscriptionAlternativesOutput } from "@/ai/flows/suggest-subscription-alternatives";
import { z } from 'zod';

// Define SubscriptionCategorySchema
export const SubscriptionCategorySchema = z.enum(['Entertainment', 'Utilities', 'SaaS', 'Productivity', 'Finance', 'Health & Wellness', 'Shopping', 'Education', 'Other']);
export type SubscriptionCategory = z.infer<typeof SubscriptionCategorySchema>;


// Define DetectRecurringChargesOutputSchema using SubscriptionCategorySchema
export const DetectRecurringChargesOutputSchema = z.array(
  z.object({
    vendor: z.string().describe('The name of the subscription vendor (e.g., Netflix, Spotify).'),
    amount: z.number().describe('The recurring charge amount.'),
    frequency: z.string().describe('The frequency of the charge (e.g., monthly, yearly).'),
    last_payment_date: z.string().describe('The date of the last payment (YYYY-MM-DD).'),
    next_due_date: z.string().describe('The estimated next due date (YYYY-MM-DD).'),
    usage_count: z.number().optional().describe('A mock or simulated usage count. 0 indicates potentially unused.'),
    category: SubscriptionCategorySchema.describe('The category of the subscription (e.g., Entertainment, Utilities, SaaS, Productivity, Finance, Health & Wellness, Shopping, Education, Other). Assign "Other" if unsure or it doesn\'t fit well.'),
  })
);
// Infer DetectRecurringChargesOutput type from the schema
export type DetectRecurringChargesOutput = z.infer<typeof DetectRecurringChargesOutputSchema>;


export type SubscriptionStatus = 'active' | 'paused';

export interface Subscription {
  id: string;
  vendor: string;
  amount: number;
  frequency: string;
  last_payment_date: string;
  next_due_date: string;
  usage_count?: number;
  userNeeds?: string;
  isUnused?: boolean; 
  unusedSince?: string;
  alternatives?: string[];
  alternativesReasoning?: string;
  status: SubscriptionStatus; 
  category?: SubscriptionCategory; 
}

export interface Wallet {
  userId: string;
  balance: number;
}

export type TransactionType = 'add_funds' | 'charge_success' | 'charge_failed' | 'status_change';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount?: number; 
  description: string;
  timestamp: string; // ISO date string
  subscriptionId?: string; 
  relatedDetail?: string; 
}


// Re-exporting AI types for convenience
export type {
  // DetectRecurringChargesOutput is defined above
  SuggestSubscriptionAlternativesOutput
};



import type { DetectRecurringChargesOutput } from "@/ai/flows/detect-recurring-charges";
import type { SuggestSubscriptionAlternativesOutput } from "@/ai/flows/suggest-subscription-alternatives";

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
  isUnused?: boolean; // Can be deprecated if status covers it well
  unusedSince?: string;
  alternatives?: string[];
  alternativesReasoning?: string;
  status: SubscriptionStatus; // New field for active/paused
  category?: 'Entertainment' | 'Utilities' | 'SaaS' | 'Productivity' | 'Finance' | 'Health & Wellness' | 'Shopping' | 'Education' | 'Other'; // Added for analytics
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
  amount?: number; // Optional, as status_change might not have an amount
  description: string;
  timestamp: string; // ISO date string
  subscriptionId?: string; // Link to subscription if applicable
  relatedDetail?: string; // e.g., "Paused Netflix" or "Failed charge for Spotify"
}


// Re-exporting AI types for convenience
export type {
  DetectRecurringChargesOutput,
  SuggestSubscriptionAlternativesOutput
};


'use server';

/**
 * @fileOverview Detects recurring charges from bank data using GenAI, including vendor, amount, frequency, last payment date, estimated next due date, usage count, and category.
 *
 * - detectRecurringCharges - A function that analyzes bank data to identify recurring charges.
 * - DetectRecurringChargesInput - The input type for the detectRecurringCharges function.
 * - DetectRecurringChargesOutput - The return type for the detectRecurringCharges function.
 * - DetectRecurringChargesOutputSchema - The Zod schema for the output.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectRecurringChargesInputSchema = z.object({
  bankData: z
    .string()
    .describe('Bank transaction data as a string, including descriptions, amounts, and dates.'),
});
export type DetectRecurringChargesInput = z.infer<typeof DetectRecurringChargesInputSchema>;

const SubscriptionCategorySchema = z.enum(['Entertainment', 'Utilities', 'SaaS', 'Productivity', 'Finance', 'Health & Wellness', 'Shopping', 'Education', 'Other']);

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
export type DetectRecurringChargesOutput = z.infer<typeof DetectRecurringChargesOutputSchema>;

export async function detectRecurringCharges(input: DetectRecurringChargesInput): Promise<DetectRecurringChargesOutput> {
  return detectRecurringChargesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectRecurringChargesPrompt',
  input: {schema: DetectRecurringChargesInputSchema},
  output: {schema: DetectRecurringChargesOutputSchema},
  prompt: `You are an expert financial analyst. Analyze the following bank transaction data and identify any recurring subscription payments.
For each detected subscription, return a JSON array of objects, where each object contains:
- vendor: The name of the subscription vendor (e.g., Netflix, Spotify, AWS).
- amount: The recurring charge amount.
- frequency: The frequency of the charge (e.g., monthly, yearly).
- last_payment_date: The date of the last recorded payment for this subscription from the provided data (format YYYY-MM-DD). If multiple payments for the same vendor, use the latest one.
- next_due_date: Estimate the next due date based on the last_payment_date and frequency (format YYYY-MM-DD).
- usage_count: (Optional) Provide a mock or simulated usage count for this subscription. If the subscription appears unused or based on hints in the data (like "UnusedGym"), set this to 0. Otherwise, provide a small positive integer (e.g., 1 to 5).
- category: Classify the subscription into one of the following categories: Entertainment, Utilities, SaaS, Productivity, Finance, Health & Wellness, Shopping, Education, Other. If unsure or it doesn't fit well, use "Other".

Flag subscriptions that may be unused or underutilized by setting usage_count to 0.

Bank Data:
{{{bankData}}}
`,
});

const detectRecurringChargesFlow = ai.defineFlow(
  {
    name: 'detectRecurringChargesFlow',
    inputSchema: DetectRecurringChargesInputSchema,
    outputSchema: DetectRecurringChargesOutputSchema,
  },
  async input => {
    try {
      const result = await prompt(input);

      if (result.error) {
        console.error(`[detectRecurringChargesFlow] AI prompt execution error: ${result.error}`);
        throw new Error(`AI prompt execution failed: ${result.error}`);
      }

      if (!result.output) {
        console.error('[detectRecurringChargesFlow] AI model returned null or undefined output, and no explicit error from prompt.');
        throw new Error('AI model failed to generate valid recurring charges output or the output was null.');
      }
      return result.output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Avoid double-prefixing error messages
      let finalErrorMessage = `AI processing failed in detectRecurringChargesFlow: ${errorMessage}`;
      if (errorMessage.startsWith('AI prompt execution failed:') || 
          errorMessage.startsWith('AI model failed to generate') ||
          errorMessage.startsWith('AI processing failed in detectRecurringChargesFlow:')) {
        finalErrorMessage = errorMessage;
      }
      
      console.error(`[detectRecurringChargesFlow] Error: ${finalErrorMessage}`);
      throw new Error(finalErrorMessage);
    }
  }
);


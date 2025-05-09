
'use server';

/**
 * @fileOverview Detects recurring charges from email content using GenAI.
 *
 * - detectChargesFromEmail - A function that analyzes email content to identify recurring charges.
 * - DetectChargesFromEmailInput - The input type for the detectChargesFromEmail function.
 * - DetectChargesFromEmailOutput - The return type for the detectChargesFromEmail function (reuses DetectRecurringChargesOutput).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// Import schema and type from types.ts
import type { DetectRecurringChargesOutput } from '@/types'; 
import { DetectRecurringChargesOutputSchema } from '@/types'; 

const DetectChargesFromEmailInputSchema = z.object({
  emailContent: z
    .string()
    .describe('Content of one or more emails (text or HTML) to be analyzed for subscription information.'),
});
export type DetectChargesFromEmailInput = z.infer<typeof DetectChargesFromEmailInputSchema>;

// Output type is the same as detect-recurring-charges
export type DetectChargesFromEmailOutput = DetectRecurringChargesOutput;

export async function detectChargesFromEmail(input: DetectChargesFromEmailInput): Promise<DetectChargesFromEmailOutput> {
  return detectChargesFromEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectChargesFromEmailPrompt',
  input: {schema: DetectChargesFromEmailInputSchema},
  output: {schema: DetectRecurringChargesOutputSchema}, // Use the imported schema
  prompt: `You are an expert financial analyst. Analyze the following email content (which might contain multiple emails separated by '---' or similar) and identify any recurring subscription payments, sign-up confirmations, or billing statements.
For each detected subscription, extract or infer the following:
- vendor: The name of the subscription vendor (e.g., Netflix, Spotify, AWS).
- amount: The recurring charge amount. If multiple amounts are mentioned for the same service (e.g., an old price and a new price), prefer the most recent or current price.
- frequency: The frequency of the charge (e.g., monthly, yearly). Infer if not explicitly stated (e.g., "billed every month" means monthly).
- last_payment_date: The date of the last recorded payment from the email content (format YYYY-MM-DD). If it's a sign-up confirmation, this might be the sign-up date or first payment date.
- next_due_date: Estimate the next due date based on the last_payment_date and frequency (format YYYY-MM-DD). If it's a sign-up confirmation and a trial period is mentioned, estimate the first payment date after the trial.
- usage_count: (Optional) Provide a mock or simulated usage count. Default to a small positive integer (e.g., 1 to 3) unless the email suggests non-usage.
- category: Classify the subscription into one of the following categories: Entertainment, Utilities, SaaS, Productivity, Finance, Health & Wellness, Shopping, Education, Other. If unsure or it doesn't fit well, use "Other".

Return a JSON array of objects matching the defined output schema.

Email Content:
{{{emailContent}}}
`,
});

const detectChargesFromEmailFlow = ai.defineFlow(
  {
    name: 'detectChargesFromEmailFlow',
    inputSchema: DetectChargesFromEmailInputSchema,
    outputSchema: DetectRecurringChargesOutputSchema, // Use the imported schema
  },
  async input => {
    try {
      const result = await prompt(input);

      if (result.error) {
        console.error(`[detectChargesFromEmailFlow] AI prompt execution error: ${result.error}`);
        throw new Error(`AI prompt execution failed: ${result.error}`);
      }

      if (!result.output) {
        console.error('[detectChargesFromEmailFlow] AI model returned null or undefined output, and no explicit error from prompt.');
        throw new Error('AI model failed to generate valid recurring charges output from email or the output was null.');
      }
      return result.output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      let finalErrorMessage = `AI processing failed in detectChargesFromEmailFlow: ${errorMessage}`;
      if (errorMessage.startsWith('AI prompt execution failed:') || 
          errorMessage.startsWith('AI model failed to generate') ||
          errorMessage.startsWith('AI processing failed in detectChargesFromEmailFlow:')) {
        finalErrorMessage = errorMessage;
      }
      
      console.error(`[detectChargesFromEmailFlow] Error: ${finalErrorMessage}`);
      throw new Error(finalErrorMessage);
    }
  }
);


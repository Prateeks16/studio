'use server';

/**
 * @fileOverview Detects recurring charges from bank data using GenAI.
 *
 * - detectRecurringCharges - A function that analyzes bank data to identify recurring charges.
 * - DetectRecurringChargesInput - The input type for the detectRecurringCharges function.
 * - DetectRecurringChargesOutput - The return type for the detectRecurringCharges function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectRecurringChargesInputSchema = z.object({
  bankData: z
    .string()
    .describe('Bank transaction data as a string, including descriptions and amounts.'),
});
export type DetectRecurringChargesInput = z.infer<typeof DetectRecurringChargesInputSchema>;

const DetectRecurringChargesOutputSchema = z.array(
  z.object({
    subscriptionName: z.string().describe('The name of the subscription service.'),
    amount: z.number().describe('The recurring charge amount.'),
    frequency: z.string().describe('The frequency of the charge (e.g., monthly, yearly).'),
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
  prompt: `You are an expert financial analyst. Analyze the following bank transaction data and identify any recurring charges or subscriptions. Return a JSON array of objects, where each object contains the subscriptionName, amount, and frequency of the charge.\n\nBank Data:\n{{bankData}}`,
});

const detectRecurringChargesFlow = ai.defineFlow(
  {
    name: 'detectRecurringChargesFlow',
    inputSchema: DetectRecurringChargesInputSchema,
    outputSchema: DetectRecurringChargesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


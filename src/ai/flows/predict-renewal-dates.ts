'use server';

/**
 * @fileOverview Predicts auto-renewal dates for identified subscriptions using AI.
 *
 * - predictRenewalDates - A function that handles the prediction of subscription renewal dates.
 * - PredictRenewalDatesInput - The input type for the predictRenewalDates function.
 * - PredictRenewalDatesOutput - The return type for the predictRenewalDates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictRenewalDatesInputSchema = z.object({
  subscriptionName: z.string().describe('The name of the subscription.'),
  lastPaymentDate: z.string().describe('The date of the last payment (YYYY-MM-DD).'),
  billingCycle: z.string().describe('The billing cycle (e.g., monthly, yearly).'),
});
export type PredictRenewalDatesInput = z.infer<typeof PredictRenewalDatesInputSchema>;

const PredictRenewalDatesOutputSchema = z.object({
  predictedRenewalDate: z.string().describe('The predicted renewal date (YYYY-MM-DD).'),
  confidence: z.number().describe('A confidence score (0-1) for the prediction.'),
});
export type PredictRenewalDatesOutput = z.infer<typeof PredictRenewalDatesOutputSchema>;

export async function predictRenewalDates(input: PredictRenewalDatesInput): Promise<PredictRenewalDatesOutput> {
  return predictRenewalDatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictRenewalDatesPrompt',
  input: {schema: PredictRenewalDatesInputSchema},
  output: {schema: PredictRenewalDatesOutputSchema},
  prompt: `You are a subscription renewal date prediction expert.

  Given the subscription name, last payment date, and billing cycle, predict the next renewal date.
  Also, provide a confidence score (0-1) for your prediction.

  Subscription Name: {{{subscriptionName}}}
  Last Payment Date: {{{lastPaymentDate}}}
  Billing Cycle: {{{billingCycle}}}

  Return the predicted renewal date and confidence score in JSON format.
  `,
});

const predictRenewalDatesFlow = ai.defineFlow(
  {
    name: 'predictRenewalDatesFlow',
    inputSchema: PredictRenewalDatesInputSchema,
    outputSchema: PredictRenewalDatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

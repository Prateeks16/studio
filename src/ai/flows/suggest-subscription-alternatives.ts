'use server';

/**
 * @fileOverview Suggests free or cheaper alternatives to existing subscriptions.
 *
 * - suggestSubscriptionAlternatives - A function that suggests free or cheaper alternatives to existing subscriptions.
 * - SuggestSubscriptionAlternativesInput - The input type for the suggestSubscriptionAlternatives function.
 * - SuggestSubscriptionAlternativesOutput - The return type for the suggestSubscriptionAlternatives function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSubscriptionAlternativesInputSchema = z.object({
  subscriptionName: z.string().describe('The name of the subscription.'),
  userNeeds: z.string().describe('The user needs for the subscription.'),
  currentCost: z.number().describe('The current cost of the subscription.'),
});
export type SuggestSubscriptionAlternativesInput = z.infer<
  typeof SuggestSubscriptionAlternativesInputSchema
>;

const SuggestSubscriptionAlternativesOutputSchema = z.object({
  alternatives: z
    .array(z.string())
    .describe(
      'A list of free or cheaper alternatives to the existing subscription.'
    ),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested alternatives.'),
});
export type SuggestSubscriptionAlternativesOutput = z.infer<
  typeof SuggestSubscriptionAlternativesOutputSchema
>;

export async function suggestSubscriptionAlternatives(
  input: SuggestSubscriptionAlternativesInput
): Promise<SuggestSubscriptionAlternativesOutput> {
  return suggestSubscriptionAlternativesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSubscriptionAlternativesPrompt',
  input: {schema: SuggestSubscriptionAlternativesInputSchema},
  output: {schema: SuggestSubscriptionAlternativesOutputSchema},
  prompt: `You are a personal finance advisor. A user has a subscription to {{{subscriptionName}}} that costs ${'{{{currentCost}}}'} and needs it for {{{userNeeds}}}. Suggest some free or cheaper alternatives. Explain your reasoning for each suggestion. Return the suggestions in the requested JSON schema.`,
});

const suggestSubscriptionAlternativesFlow = ai.defineFlow(
  {
    name: 'suggestSubscriptionAlternativesFlow',
    inputSchema: SuggestSubscriptionAlternativesInputSchema,
    outputSchema: SuggestSubscriptionAlternativesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


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
    .describe('The reasoning behind the suggested alternatives, including any assumed primary use cases.'),
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
  prompt: `You are a personal finance advisor. A user has a subscription to "{{{subscriptionName}}}" that currently costs {{{currentCost}}}.
Based on common uses for "{{{subscriptionName}}}", please suggest some free or cheaper alternatives.
For each alternative, explain your reasoning. This reasoning should include the primary use case(s) you assumed for the original subscription when making your suggestions.
Ensure your output is a JSON object matching the specified schema.`,
});

const suggestSubscriptionAlternativesFlow = ai.defineFlow(
  {
    name: 'suggestSubscriptionAlternativesFlow',
    inputSchema: SuggestSubscriptionAlternativesInputSchema,
    outputSchema: SuggestSubscriptionAlternativesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI model failed to generate valid subscription alternatives or the output was null.');
    }
    return output;
  }
);


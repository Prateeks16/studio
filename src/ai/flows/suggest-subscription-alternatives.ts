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
    try {
      const result = await prompt(input);

      if (result.error) {
        console.error(`[suggestSubscriptionAlternativesFlow] AI prompt execution error: ${result.error}`);
        throw new Error(`AI prompt execution failed: ${result.error}`);
      }

      if (!result.output) {
        console.error('[suggestSubscriptionAlternativesFlow] AI model returned null or undefined output, and no explicit error from prompt.');
        throw new Error('AI model failed to generate valid subscription alternatives or the output was null.');
      }
      return result.output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Avoid double-prefixing error messages
      let finalErrorMessage = `AI processing failed in suggestSubscriptionAlternativesFlow: ${errorMessage}`;
       if (errorMessage.startsWith('AI prompt execution failed:') || 
           errorMessage.startsWith('AI model failed to generate') ||
           errorMessage.startsWith('AI processing failed in suggestSubscriptionAlternativesFlow:')) {
        finalErrorMessage = errorMessage;
      }

      console.error(`[suggestSubscriptionAlternativesFlow] Error: ${finalErrorMessage}`);
      throw new Error(finalErrorMessage);
    }
  }
);

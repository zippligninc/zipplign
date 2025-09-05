// src/ai/flows/personalized-content-recommendations.ts
'use server';

/**
 * @fileOverview Recommends Zippclips tailored to user interests based on viewing history and trending tags.
 *
 * - recommendZippclips - A function that recommends Zippclips.
 * - RecommendZippclipsInput - The input type for the recommendZippclips function.
 * - RecommendZippclipsOutput - The return type for the recommendZippclips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendZippclipsInputSchema = z.object({
  viewingHistory: z
    .array(z.string())
    .describe('An array of Zippclip IDs representing the user\'s viewing history.'),
  trendingTags: z
    .array(z.string())
    .describe('An array of trending tags to consider for recommendations.'),
  numRecommendations: z
    .number()
    .default(5)
    .describe('The number of Zippclip recommendations to return.'),
});
export type RecommendZippclipsInput = z.infer<typeof RecommendZippclipsInputSchema>;

const RecommendZippclipsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('An array of Zippclip IDs recommended for the user.'),
});
export type RecommendZippclipsOutput = z.infer<typeof RecommendZippclipsOutputSchema>;

export async function recommendZippclips(input: RecommendZippclipsInput): Promise<RecommendZippclipsOutput> {
  return recommendZippclipsFlow(input);
}

const recommendZippclipsPrompt = ai.definePrompt({
  name: 'recommendZippclipsPrompt',
  input: {schema: RecommendZippclipsInputSchema},
  output: {schema: RecommendZippclipsOutputSchema},
  prompt: `You are a Zippclip recommendation expert. Given a user's viewing history and current trending tags, recommend Zippclips that the user would enjoy.

User Viewing History: {{#if viewingHistory}}{{#each viewingHistory}}- {{{this}}}\n{{/each}}{{else}}No viewing history available.{{/if}}
Trending Tags: {{#if trendingTags}}{{#each trendingTags}}- {{{this}}}\n{{/each}}{{else}}No trending tags available.{{/if}}

Recommend {{numRecommendations}} Zippclip IDs that the user would enjoy based on their viewing history and the current trending tags.  Return only the IDs, one ID per line, with no other text.`,
});

const recommendZippclipsFlow = ai.defineFlow(
  {
    name: 'recommendZippclipsFlow',
    inputSchema: RecommendZippclipsInputSchema,
    outputSchema: RecommendZippclipsOutputSchema,
  },
  async input => {
    const {output} = await recommendZippclipsPrompt(input);
    // Optionally parse the output to ensure it matches the expected format.
    const recommendations = output!.recommendations;
    return {recommendations};
  }
);

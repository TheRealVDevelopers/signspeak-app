'use server';
/**
 * @fileOverview Detects a sign language gesture from an image.
 * This flow now uses a general vision model to identify one of a few common signs.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectSignInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A snapshot of the webcam feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectSignInput = z.infer<typeof DetectSignInputSchema>;

const DetectSignOutputSchema = z.object({
  detectedWord: z
    .string()
    .describe('The detected word. Should be one of "Hello", "Yes", "No", "Thank You", "Please", or "Unrecognized".'),
  confidence: z.number().describe('The confidence level (0-1) of the prediction.'),
});
export type DetectSignOutput = z.infer<typeof DetectSignOutputSchema>;

export async function detectSign(input: DetectSignInput): Promise<DetectSignOutput> {
  return detectSignFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectSignPrompt',
  input: {schema: DetectSignInputSchema},
  output: {schema: DetectSignOutputSchema},
  prompt: `Analyze the image of a hand gesture. Your task is to identify which of the following common signs is being made: "Hello", "Yes", "No", "Thank You", "Please".

If the gesture clearly matches one of these signs, return that sign name.

If the gesture does not match any of the signs, or if it is unclear, you MUST return the word "Unrecognized".

Provide a confidence score from 0.0 to 1.0. If the sign is unrecognized, the confidence should reflect the confidence that it is indeed none of the listed signs.

Image: {{media url=imageDataUri}}`,
});

const detectSignFlow = ai.defineFlow(
  {
    name: 'detectSignFlow',
    inputSchema: DetectSignInputSchema,
    outputSchema: DetectSignOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // If the model fails to produce any structured output, return a default "Unrecognized" response.
      return {
        detectedWord: 'Unrecognized',
        confidence: 0,
      };
    }
    return output;
  }
);

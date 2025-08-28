// sign-detection.ts
'use server';
/**
 * @fileOverview Detects sign language gestures from a webcam feed and displays the corresponding word.
 *
 * - detectSign - A function that handles the sign detection process.
 * - DetectSignInput - The input type for the detectSign function.
 * - DetectSignOutput - The return type for the detectSign function.
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
    .describe('The detected word from the sign language gesture.'),
  confidence: z.number().describe('The confidence level of the prediction.'),
});
export type DetectSignOutput = z.infer<typeof DetectSignOutputSchema>;

export async function detectSign(input: DetectSignInput): Promise<DetectSignOutput> {
  return detectSignFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectSignPrompt',
  input: {schema: DetectSignInputSchema},
  output: {schema: DetectSignOutputSchema},
  prompt: `You are a sign language expert. Analyze the image of the hand gesture and determine which word is being signed from the list: Hello, Yes, No, Thank You, Please. Return the detected word and the confidence level of your prediction.

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
    return output!;
  }
);

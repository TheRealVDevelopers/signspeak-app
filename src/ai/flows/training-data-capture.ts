'use server';

/**
 * @fileOverview This flow handles the capture of training data for the sign language detection model.
 *
 * @exports addTrainingData - A function to add training data samples for a specific sign.
 * @exports AddTrainingDataInput - The input type for the addTrainingData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AddTrainingDataInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      'A photo of a hand gesture, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Ensure correct formatting
    ),
  label: z.string().describe('The label for the sign (e.g., \'hello\', \'yes\', \'no\').'),
});

export type AddTrainingDataInput = z.infer<typeof AddTrainingDataInputSchema>;

export async function addTrainingData(input: AddTrainingDataInput) {
  return addTrainingDataFlow(input);
}

const addTrainingDataFlow = ai.defineFlow(
  {
    name: 'addTrainingDataFlow',
    inputSchema: AddTrainingDataInputSchema,
    outputSchema: z.any(), // The KNN classifier does not produce a schema to be specified here
  },
  async input => {
    // This flow itself doesn't directly return any output.  The KNN classifier
    // is modified as a side effect.  So this flow does nothing.
    return {};
  }
);

'use server';
/**
 * @fileOverview Captures training data by generating embeddings from an image.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TrainingDataInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A snapshot from the webcam, as a data URI that must include a MIME type and use Base64 encoding."
    ),
});

const TrainingDataOutputSchema = z.object({
  embeddings: z.array(z.number()).describe('The generated embeddings for the image.'),
});

export async function captureTrainingData(input: z.infer<typeof TrainingDataInputSchema>): Promise<z.infer<typeof TrainingDataOutputSchema>> {
    return captureTrainingDataFlow(input);
}

const captureTrainingDataFlow = ai.defineFlow(
  {
    name: 'captureTrainingDataFlow',
    inputSchema: TrainingDataInputSchema,
    outputSchema: TrainingDataOutputSchema,
  },
  async ({ imageDataUri }) => {
    
    const embedding = await ai.embed({
        embedder: 'googleai/embedding-001',
        content: { media: { url: imageDataUri } },
    });

    return {
        embeddings: embedding,
    };
  }
);

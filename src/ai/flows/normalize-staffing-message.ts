'use server';

/**
 * @fileOverview Normalizes a staffing message using GenAI to extract key information.
 *
 * - normalizeStaffingMessage - A function that normalizes a staffing message.
 * - NormalizeStaffingMessageInput - The input type for the normalizeStaffingMessage function.
 * - NormalizeStaffingMessageOutput - The return type for the normalizeStaffingMessage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const NormalizeStaffingMessageInputSchema = z.object({
  message: z.string().describe('The staffing message to normalize.'),
});
export type NormalizeStaffingMessageInput = z.infer<typeof NormalizeStaffingMessageInputSchema>;

const NormalizeStaffingMessageOutputSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  role: z.string().describe('The name of the role.'),
  techStack: z.string().describe('The required tech stack.'),
  projectDuration: z.string().optional().describe('The duration of the project, if specified.'),
  teamSize: z.string().optional().describe('The approximate size of the team, if specified.'),
  englishLevel: z.string().optional().describe('The minimum required level of English, if specified.'),
  relevantInfo: z.string().describe('Relevant information from the request that was not included in other fields.'),
});
export type NormalizeStaffingMessageOutput = z.infer<typeof NormalizeStaffingMessageOutputSchema>;

export async function normalizeStaffingMessage(input: NormalizeStaffingMessageInput): Promise<NormalizeStaffingMessageOutput> {
  return normalizeStaffingMessageFlow(input);
}

const normalizeStaffingMessagePrompt = ai.definePrompt({
  name: 'normalizeStaffingMessagePrompt',
  input: {
    schema: z.object({
      message: z.string().describe('The staffing message to normalize.'),
    }),
  },
  output: {
    schema: z.object({
      companyName: z.string().describe('The name of the company.'),
      role: z.string().describe('The name of the role.'),
      techStack: z.string().describe('The required tech stack.'),
      projectDuration: z.string().optional().describe('The duration of the project, if specified.'),
      teamSize: z.string().optional().describe('The approximate size of the team, if specified.'),
      englishLevel: z.string().optional().describe('The minimum required level of English, if specified.'),
      relevantInfo: z.string().describe('Relevant information from the request that was not included in other fields.'),
    }),
  },
  prompt: `Analyze this staffing request and extract the following information, answering in English:
1. Company Name
2. Role
3. Required Tech Stack
4. Project Duration
5. Approximate Team Size (if specified or implied)
6. Minimum English Level
7. Relevant information from the request that was not included in other categories

Format your response as Markdown with headings.

Original text:
{{{message}}}`,
});

const normalizeStaffingMessageFlow = ai.defineFlow<
  typeof NormalizeStaffingMessageInputSchema,
  typeof NormalizeStaffingMessageOutputSchema
>(
  {
    name: 'normalizeStaffingMessageFlow',
    inputSchema: NormalizeStaffingMessageInputSchema,
    outputSchema: NormalizeStaffingMessageOutputSchema,
  },
  async input => {
    const {output} = await normalizeStaffingMessagePrompt(input);
    return output!;
  }
);


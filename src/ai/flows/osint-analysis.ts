'use server';
/**
 * @fileOverview OSINT analysis flow for gathering information about a company.
 *
 * - performOsintAnalysis - A function that handles the OSINT analysis process.
 * - OsintAnalysisInput - The input type for the performOsintAnalysis function.
 * - OsintAnalysisOutput - The return type for the performOsintAnalysis function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const OsintAnalysisInputSchema = z.object({
  companyName: z.string().describe('The name of the company to analyze.'),
  normalizedData: z.string().describe('The normalized staffing message data.'),
});
export type OsintAnalysisInput = z.infer<typeof OsintAnalysisInputSchema>;

const OsintAnalysisOutputSchema = z.object({
  companyInfo: z.object({
    summary: z.string().describe('A summary of what the company does (website, sector, clients, products).'),
    type: z.string().describe('The type of company (startup / corporation / R&D center).'),
    interestingFacts: z.string().describe('Interesting facts about the company (AI, investments, hiring).'),
    attractivenessScore: z.number().describe('How attractive the company is for a QA Automation Engineer (score from 1 to 5).'),
    idealCandidateProfile: z.string().describe('The ideal QA specialist profile for working in this company, including soft skills, hard skills, tasks, and familiar projects/technologies.'),
  }).describe('OSINT analysis of the company')
});
export type OsintAnalysisOutput = z.infer<typeof OsintAnalysisOutputSchema>;

export async function performOsintAnalysis(input: OsintAnalysisInput): Promise<OsintAnalysisOutput> {
  return osintAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'osintAnalysisPrompt',
  input: {
    schema: z.object({
      companyName: z.string().describe('The name of the company.'),
      normalizedData: z.string().describe('The normalized staffing message data.'),
    }),
  },
  output: {
    schema: z.object({
      companyInfo: z.object({
        summary: z.string().describe('A summary of what the company does (website, sector, clients, products).'),
        type: z.string().describe('The type of company (startup / corporation / R&D center).'),
        interestingFacts: z.string().describe('Interesting facts about the company (AI, investments, hiring).'),
        attractivenessScore: z.number().describe('How attractive the company is for a QA Automation Engineer (score from 1 to 5).'),
        idealCandidateProfile: z.string().describe('The ideal QA specialist profile for working in this company, including soft skills, hard skills, tasks, and familiar projects/technologies.'),
      }).describe('OSINT analysis of the company')
    }),
  },
  prompt: `You are an AI analyst. Given the company name and normalized data from the hiring message, perform an OSINT analysis to gather information about the company. Answer in Russian.

Company name: {{{companyName}}}

Normalized data:
{{{normalizedData}}}

Generate the following information, formatted as Markdown with titles:

1.  What does this company do (website, sector, clients, products)?
2.  What type of company is it (startup / corporation / R&D center)?
3.  What are some interesting facts about the company (AI, investments, hiring)?
4.  How attractive is this company for a QA Automation Engineer, based on the project stack (score from 1 to 5)?
5.  What is the ideal profile of a QA specialist for working in this company, including soft skills, hard skills, tasks, and familiar projects/technologies?`,
});

const osintAnalysisFlow = ai.defineFlow<
  typeof OsintAnalysisInputSchema,
  typeof OsintAnalysisOutputSchema
>({
  name: 'osintAnalysisFlow',
  inputSchema: OsintAnalysisInputSchema,
  outputSchema: OsintAnalysisOutputSchema,
}, async input => {
  try {
    const {output} = await prompt(input);
    return output!;
  } catch (e: any) {
    if (e.message.includes('503 Service Unavailable')) {
      console.error('Service Unavailable error: ', e);
      return {
        companyInfo: {
          summary: 'Service Unavailable',
          type: 'Service Unavailable',
          interestingFacts: 'Service Unavailable',
          attractivenessScore: 0,
          idealCandidateProfile: 'Service Unavailable',
        },
      };
    }
    throw e;
  }
});

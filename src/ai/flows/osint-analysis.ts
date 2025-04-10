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
  prompt: `Ты - AI аналитик. Учитывая название компании и нормализованные данные из сообщения о найме, выполни OSINT-анализ для сбора информации о компании. Ответь на русском языке.

Название компании: {{{companyName}}}

Нормализованные данные:
{{{normalizedData}}}

Сгенерируй следующую информацию, отформатированную как Markdown с заголовками:

1.  Что делает эта компания (веб-сайт, сектор, клиенты, продукты)?
2.  Какой тип компании (стартап / корпорация / R&D центр)?
3.  Какие интересные факты о компании (AI, инвестиции, наем)?
4.  Насколько привлекательна эта компания для QA Automation Engineer, исходя из стека проекта (оценка от 1 до 5)?
5.  Каков идеальный профиль QA-специалиста для работы в этой компании, включая софт-скиллы, хард-скиллы, задачи и привычные проекты/технологии?`,
});

const osintAnalysisFlow = ai.defineFlow<
  typeof OsintAnalysisInputSchema,
  typeof OsintAnalysisOutputSchema
>({
  name: 'osintAnalysisFlow',
  inputSchema: OsintAnalysisInputSchema,
  outputSchema: OsintAnalysisOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});



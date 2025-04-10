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
  prompt: `Проанализируй этот стаффинг-запрос и извлеки следующую информацию:
1. Название компании
2. Название роли
3. Необходимый технологический стек
4. Продолжительность проекта
5. Приблизительный размер команды (если указан или подразумевается)
6. Минимальный уровень английского языка
7. Релевантная информация из запроса, не включенная в другие категории

Форматируй свой ответ в Markdown с заголовками.

Исходный текст:
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



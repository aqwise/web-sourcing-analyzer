"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performOsintAnalysis, OsintAnalysisOutput } from "@/ai/flows/osint-analysis";
import { normalizeStaffingMessage, NormalizeStaffingMessageOutput } from "@/ai/flows/normalize-staffing-message";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  type: 'normalized' | 'osint';
  content: string;
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [normalizedData, setNormalizedData] = useState<NormalizeStaffingMessageOutput | null>(null);
  const [osintResults, setOsintResults] = useState<OsintAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalysis = async () => {
    setIsLoading(true);

    try {
      const normalized = await normalizeStaffingMessage({ message });
      setNormalizedData(normalized);

      const normalizedContent = `
**Название компании:** ${normalized.companyName}
**Роль:** ${normalized.role}
**Технологический стек:** ${normalized.techStack}
**Длительность проекта:** ${normalized.projectDuration || 'Не указана'}
**Размер команды:** ${normalized.teamSize || 'Не указан'}
**Уровень английского:** ${normalized.englishLevel || 'Не указан'}
**Релевантная информация:**\n${normalized.relevantInfo}`;

      setChatHistory(prev => [...prev, { type: 'normalized', content: normalizedContent }]);

      const osint = await performOsintAnalysis({
        companyName: normalized.companyName,
        normalizedData: JSON.stringify(normalized),
      });
      setOsintResults(osint);

      let osintContent = "";
      if (osint && osint.companyInfo) {
        osintContent = `
**Обзор компании:** ${osint.companyInfo.summary}
**Тип компании:** ${osint.companyInfo.type}
**Интересные факты:** ${osint.companyInfo.interestingFacts}
**Привлекательность для QA Automation:** ${osint.companyInfo.attractivenessScore}
**Идеальный кандидат:** ${osint.companyInfo.idealCandidateProfile}`;
      } else {
        osintContent = "OSINT анализ не удался или не вернул данных.";
      }

      setChatHistory(prev => [...prev, { type: 'osint', content: osintContent }]);

    } catch (error: any) {
      console.error("Analysis failed:", error);
      setChatHistory(prev => [...prev, { type: 'osint', content: `Error: ${error.message}` }]);
      // Consider implementing a toast notification for errors
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background antialiased">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">SourceWise</h1>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {/* Message Input */}
          <Card>
            <CardHeader>
              <CardTitle>Staffing Message</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste staffing message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mb-4"
              />
              <Button onClick={handleAnalysis} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              <ScrollArea className="h-[500px] w-full rounded-md border">
                <div className="space-y-4">
                  {chatHistory.map((chatMessage, index) => (
                    <div key={index} className="mb-2">
                      {chatMessage.type === 'normalized' && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold">Нормализация данных:</span>
                          <ReactMarkdown>{chatMessage.content}</ReactMarkdown>
                        </div>
                      )}
                      {chatMessage.type === 'osint' && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold">OSINT Анализ:</span>
                          <ReactMarkdown>{chatMessage.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ))}
                  {!isLoading && chatHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground">No results yet. Paste a staffing message and click "Analyze".</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

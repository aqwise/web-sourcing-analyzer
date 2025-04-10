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
  type: 'input' | 'normalized' | 'osint';
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
    setChatHistory(prev => [...prev, { type: 'input', content: message }]);

    try {
      const normalized = await normalizeStaffingMessage({ message });
      setNormalizedData(normalized);

      const normalizedContent = `
**Company Name:** ${normalized.companyName}
**Role:** ${normalized.role}
**Tech Stack:** ${normalized.techStack}
**Project Duration:** ${normalized.projectDuration || 'Not specified'}
**Team Size:** ${normalized.teamSize || 'Not specified'}
**English Level:** ${normalized.englishLevel || 'Not specified'}
**Relevant Info:**\n${normalized.relevantInfo}`;

      setChatHistory(prev => [...prev, { type: 'normalized', content: normalizedContent }]);

      const osint = await performOsintAnalysis({
        companyName: normalized.companyName,
        normalizedData: JSON.stringify(normalized),
      });
      setOsintResults(osint);

      const osintContent = `
**Company Summary:** ${osintResults.companyInfo.summary}
**Company Type:** ${osintResults.companyInfo.type}
**Interesting Facts:** ${osintResults.companyInfo.interestingFacts}
**Attractiveness Score:** ${osintResults.companyInfo.attractivenessScore}
**Ideal Candidate Profile:** ${osintResults.companyInfo.idealCandidateProfile}`;

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
                      {chatMessage.type === 'input' && (
                        <div className="text-sm text-foreground">
                          <span className="font-semibold">Input:</span>
                          <ReactMarkdown>{chatMessage.content}</ReactMarkdown>
                        </div>
                      )}
                      {chatMessage.type === 'normalized' && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold">Normalized Data:</span>
                          <ReactMarkdown>{chatMessage.content}</ReactMarkdown>
                        </div>
                      )}
                      {chatMessage.type === 'osint' && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-semibold">OSINT Analysis:</span>
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

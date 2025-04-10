"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performOsintAnalysis, OsintAnalysisOutput } from "@/ai/flows/osint-analysis";
import { normalizeStaffingMessage, NormalizeStaffingMessageOutput } from "@/ai/flows/normalize-staffing-message";
import { Icons } from "@/components/icons";
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  type: 'prompt' | 'normalized' | 'osint';
  content: string;
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [osintResults, setOsintResults] = useState<OsintAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState('auto');

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      setTextareaHeight(textareaRef.current.style.height);
    }
  };

  const handleAnalysis = async () => {
    setIsLoading(true);

    // Add the staffing message to chat history as a prompt
    setChatHistory(prev => [...prev, { type: 'prompt', content: message }]);

    try {
      const normalized = await normalizeStaffingMessage({ message });

      const normalizedContent = `
**Company Name:** ${normalized.companyName}
**Role:** ${normalized.role}
**Tech Stack:** ${normalized.techStack}
**Project Duration:** ${normalized.projectDuration || 'Not specified'}
**Team Size:** ${normalized.teamSize || 'Not specified'}
**English Level:** ${normalized.englishLevel || 'Not specified'}
**Relevant Info:**
${normalized.relevantInfo}`;

      setChatHistory(prev => [...prev, { type: 'normalized', content: normalizedContent }]);

      const osint = await performOsintAnalysis({
        companyName: normalized.companyName,
        normalizedData: JSON.stringify(normalized),
      });

      setOsintResults(osint);

      let osintContent = "";
      if (osint && osint.companyInfo) {
        osintContent = `
**Company Summary:** ${osint.companyInfo.summary}
**Company Type:** ${osint.companyInfo.type}
**Interesting Facts:** ${osint.companyInfo.interestingFacts}
**Attractiveness Score:** ${osint.companyInfo.attractivenessScore}
**Ideal Candidate:** ${osint.companyInfo.idealCandidateProfile}`;
      } else {
        osintContent = "OSINT analysis failed or returned no data.";
      }

      setChatHistory(prev => [...prev, { type: 'osint', content: osintContent }]);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setChatHistory(prev => [...prev, { type: 'osint', content: `Error: ${error.message}` }]);
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
                ref={textareaRef}
                placeholder="Paste staffing message here..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  adjustTextareaHeight();
                }}
                style={{ height: textareaHeight }}
                className="mb-4 resize-none"
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
              <div className="space-y-4">
                {chatHistory.map((chatMessage, index) => (
                  <div key={index} className="mb-2">
                    {chatMessage.type === 'prompt' && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-semibold">Staffing Message:</span>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

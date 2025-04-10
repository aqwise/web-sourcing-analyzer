"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performOsintAnalysis, OsintAnalysisOutput } from "@/ai/flows/osint-analysis";
import { normalizeStaffingMessage, NormalizeStaffingMessageOutput } from "@/ai/flows/normalize-staffing-message";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  const [message, setMessage] = useState("");
  const [normalizedData, setNormalizedData] = useState<NormalizeStaffingMessageOutput | null>(null);
  const [osintResults, setOsintResults] = useState<OsintAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalysis = async () => {
    setIsLoading(true);
    try {
      const normalized = await normalizeStaffingMessage({ message });
      setNormalizedData(normalized);

      const osint = await performOsintAnalysis({
        companyName: normalized.companyName,
        normalizedData: JSON.stringify(normalized),
      });
      setOsintResults(osint);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      // Consider implementing a toast notification for errors
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background antialiased">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">SourceWise</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {normalizedData && (
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Normalized Data</h2>
                    <pre className="text-sm text-muted-foreground">
                      {JSON.stringify(normalizedData, null, 2)}
                    </pre>
                  </div>
                )}

                {osintResults && (
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">OSINT Analysis</h2>
                    <pre className="text-sm text-muted-foreground">
                      {JSON.stringify(osintResults, null, 2)}
                    </pre>
                  </div>
                )}

                {!normalizedData && !osintResults && (
                  <p className="text-sm text-muted-foreground">No results yet. Paste a staffing message and click "Analyze".</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

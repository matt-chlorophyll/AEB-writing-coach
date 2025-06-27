"use client";

import { useState } from "react";
import type { AnalysisResult, RewriteResponse } from "@/types/analysis";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type AppPhase = 'input' | 'analyzing' | 'ready' | 'rewriting' | 'complete';

export default function AgentsSDKPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<AppPhase>('input');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [rewriteResult, setRewriteResult] = useState<RewriteResponse | null>(null);

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || phase === 'analyzing') return;

    const userMessage: Message = { role: "user", content: input };
    setMessages([userMessage]);
    setInput("");
    setPhase('analyzing');

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get analysis response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";
      let done = false;
      let timeoutId: NodeJS.Timeout | null = null;

      // Set up a timeout to detect if analysis gets stuck
      const analysisTimeout = setTimeout(() => {
        console.warn("Analysis appears to be stuck, attempting to reset");
        setPhase('input');
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            lastMessage.content += "\n\n⚠️ Analysis timed out. Please try again with a shorter text or try rephrasing your request.";
          }
          return newMessages;
        });
      }, 60000); // 60 second timeout

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                done = true;
                break;
              }
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === "conversation") {
                    // Update the streaming conversation
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastIndex = newMessages.length - 1;
                      if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
                        newMessages[lastIndex] = {
                          ...newMessages[lastIndex],
                          content: newMessages[lastIndex].content + parsed.content,
                        };
                      }
                      return newMessages;
                    });
                  } else if (parsed.type === "analysis_complete") {
                    // Analysis is complete, enable rewrite button
                    clearTimeout(analysisTimeout);
                    setAnalysisResult(parsed.analysisResult);
                    setPhase('ready');
                  }
                } catch (e) {
                  console.warn("Failed to parse streaming data:", data);
                }
              }
            }
          }
        }
      }
      
      // Always clear timeout when done
      clearTimeout(analysisTimeout);
    } catch (error) {
      clearTimeout(analysisTimeout);
      console.error("Analysis error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === "assistant") {
          lastMessage.content = "Sorry, there was an error during analysis. Please try again.";
        }
        return newMessages;
      });
      setPhase('input');
    }
  };

  const handleRewrite = async () => {
    if (!analysisResult || phase === 'rewriting') return;

    setPhase('rewriting');
    setRewriteResult(null);

    try {
      const rewriteRequest = {
        analysisId: analysisResult.id,
        originalText: analysisResult.originalText,
        instructions: analysisResult.retrievedInstructions,
        context: {
          textType: analysisResult.detectedTextType,
          tone: analysisResult.extractedContext.tone,
          purpose: analysisResult.extractedContext.purpose,
          audience: analysisResult.extractedContext.audience,
        },
      };

      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rewriteRequest),
      });

      if (!response.ok) {
        throw new Error("Failed to get rewrite response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";
      let done = false;
      let streamingText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                done = true;
                break;
              }
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === "rewrite_chunk") {
                    streamingText += parsed.content;
                    // Create a temporary result for streaming display
                    setRewriteResult({
                      originalText: analysisResult.originalText,
                      rewrittenText: streamingText,
                      explanation: "Processing...",
                      changesHighlighted: [],
                    });
                  } else if (parsed.type === "rewrite_complete") {
                    // Rewriting is complete
                    setRewriteResult(parsed.result);
                    setPhase('complete');
                  }
                } catch (e) {
                  console.warn("Failed to parse rewrite data:", data);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Rewrite error:", error);
      setPhase('ready');
    }
  };

  const resetFlow = () => {
    setMessages([]);
    setInput("");
    setPhase('input');
    setAnalysisResult(null);
    setRewriteResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              ✨ AI Writing Coach
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Two-step process: First I'll analyze your text, then rewrite it perfectly
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className={`flex items-center gap-2 ${phase === 'analyzing' ? 'text-blue-700' : phase === 'ready' || phase === 'rewriting' || phase === 'complete' ? 'text-green-700' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${phase === 'analyzing' ? 'bg-blue-500 animate-pulse' : phase === 'ready' || phase === 'rewriting' || phase === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="font-medium">1. Analysis</span>
              </div>
              <div className={`flex items-center gap-2 ${phase === 'rewriting' ? 'text-blue-700' : phase === 'complete' ? 'text-green-700' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${phase === 'rewriting' ? 'bg-blue-500 animate-pulse' : phase === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="font-medium">2. Rewriting</span>
              </div>
              <div className={`flex items-center gap-2 ${phase === 'complete' ? 'text-green-700' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${phase === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="font-medium">3. Complete</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Analysis Chat Interface */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">💬 Analysis & Discussion</h2>
            </div>
            
            <div className="h-96 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center mt-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-2">Ready to analyze your text!</p>
                  <p className="text-sm text-gray-600 max-w-xs mx-auto">
                    Share your text and I'll help analyze what type it is and find the best rewriting approach
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      message.role === "user" ? "flex justify-end" : "flex justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-sm p-4 rounded-2xl shadow-sm ${
                        message.role === "user"
                          ? "bg-green-500 text-white rounded-br-md"
                          : "bg-white border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      <div className={`text-xs font-medium mb-2 ${
                        message.role === "user" ? "text-green-100" : "text-gray-500"
                      }`}>
                        {message.role === "user" ? "You" : "Analysis Agent"}
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {phase === 'analyzing' && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-md shadow-sm max-w-xs">
                    <div className="text-xs font-medium text-gray-500 mb-2">Analysis Agent</div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm">Analyzing your text...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            {phase === 'input' && (
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleAnalysis} className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Paste your text here for analysis...&#10;&#10;For example:&#10;• A LinkedIn post you want to improve&#10;• An email that needs refinement&#10;• A blog post draft&#10;• Marketing copy to enhance"
                      className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none overflow-y-auto leading-relaxed"
                      disabled={false}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      💡 Step 1: I'll analyze your text and find relevant writing guidelines
                    </div>
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-sm flex items-center gap-2"
                    >
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Analyze Text
                      </>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Rewrite Button */}
            {(phase === 'ready' || phase === 'rewriting' || phase === 'complete') && (
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {phase === 'ready' && "✅ Analysis complete! Ready to rewrite your text."}
                    {phase === 'rewriting' && "⚡ Rewriting in progress..."}
                    {phase === 'complete' && "🎉 All done! Your text has been rewritten."}
                  </div>
                  <div className="flex gap-2">
                    {phase === 'complete' && (
                      <button
                        onClick={resetFlow}
                        className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium text-sm shadow-sm flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Start Over
                      </button>
                    )}
                    <button
                      onClick={handleRewrite}
                      disabled={phase === 'rewriting'}
                      className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-sm flex items-center gap-2"
                    >
                      {phase === 'rewriting' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Rewriting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Rewrite Text
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rewritten Text Output */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">✨ Rewritten Text</h2>
            </div>
            
            <div className="p-6 h-96 overflow-y-auto">
              {!rewriteResult ? (
                <div className="text-center mt-12 text-gray-400">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">
                      {phase === 'input' ? '📝' : phase === 'analyzing' ? '🔍' : phase === 'ready' ? '⚡' : '📝'}
                    </span>
                  </div>
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    {phase === 'input' && "Your rewritten text will appear here"}
                    {phase === 'analyzing' && "Analyzing your text..."}
                    {phase === 'ready' && "Ready to rewrite! Click the button →"}
                    {phase === 'rewriting' && "Rewriting in progress..."}
                  </p>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    {phase === 'input' && "Start by analyzing your text first"}
                    {phase === 'analyzing' && "Finding relevant writing guidelines"}
                    {phase === 'ready' && "Analysis complete, ready for rewriting"}
                    {phase === 'rewriting' && "Applying writing guidelines to your text"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Rewritten Version
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {rewriteResult.rewrittenText}
                    </div>
                  </div>
                  
                  {phase === 'complete' && rewriteResult.explanation && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-green-800 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Explanation
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {rewriteResult.explanation}
                      </div>
                    </div>
                  )}
                  
                  {phase === 'complete' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => navigator.clipboard.writeText(rewriteResult.rewrittenText)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Text
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
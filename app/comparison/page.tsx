"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ComparisonData, ChangeAnalysisResponse, Change } from "@/types/analysis";

export default function ComparisonPage() {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ChangeAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");

  useEffect(() => {
    // Get comparison data from localStorage
    const storedData = localStorage.getItem('comparisonData');
    if (storedData) {
      const data: ComparisonData = JSON.parse(storedData);
      setComparisonData(data);
      
      // Start analysis automatically
      analyzeChanges(data);
      
      // Clean up localStorage
      localStorage.removeItem('comparisonData');
    }
  }, []);

  const analyzeChanges = async (data: ComparisonData) => {
    setIsAnalyzing(true);
    setAnalysisProgress("");

    try {
      const response = await fetch("/api/analyze-changes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalText: data.originalText,
          rewrittenText: data.rewrittenText,
          context: data.context,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze changes");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";
      let done = false;

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
                  
                  if (parsed.type === "analysis_progress") {
                    setAnalysisProgress(prev => prev + parsed.content);
                  } else if (parsed.type === "analysis_complete") {
                    setAnalysisResult(parsed.result);
                    setIsAnalyzing(false);
                  }
                } catch (e) {
                  console.warn("Failed to parse analysis data:", data);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setIsAnalyzing(false);
    }
  };

  const getChangeTypeIcon = (type: Change['type']) => {
    switch (type) {
      case 'grammar': return '🔧';
      case 'tone': return '🎭';
      case 'structure': return '🏗️';
      case 'clarity': return '💡';
      case 'conciseness': return '✂️';
      case 'impact': return '🎯';
      default: return '📝';
    }
  };

  const getChangeTypeColor = (type: Change['type']) => {
    switch (type) {
      case 'grammar': return 'bg-red-50 border-red-200 text-red-800';
      case 'tone': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'structure': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'clarity': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'conciseness': return 'bg-green-50 border-green-200 text-green-800';
      case 'impact': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getImportanceColor = (importance: Change['importance']) => {
    switch (importance) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const highlightChanges = (text: string, changes: Change[], isOriginal: boolean) => {
    if (!changes.length) return text;

    // For now, we'll use a simple highlighting approach
    // In a production app, you'd want more sophisticated text diffing
    let highlightedText = text;
    
    changes.forEach((change, index) => {
      const searchText = isOriginal ? change.originalPhrase : change.rewrittenPhrase;
      const changeColor = isOriginal ? 'bg-red-100 border-l-4 border-red-400' : 'bg-green-100 border-l-4 border-green-400';
      
      if (searchText && highlightedText.includes(searchText)) {
        highlightedText = highlightedText.replace(
          searchText,
          `<mark class="${changeColor} px-1 py-0.5 rounded" data-change-id="${change.id}">${searchText}</mark>`
        );
      }
    });

    return highlightedText;
  };

  if (!comparisonData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">❓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Comparison Data Found</h1>
          <p className="text-gray-600 mb-4">Please go back and complete a text rewrite first.</p>
          <Link
            href="/agents-sdk"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go to AI Writing Coach
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="container mx-auto p-4 sm:p-6 max-w-full xl:max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/agents-sdk"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white transition-all duration-200 text-gray-700 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Writing Coach
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">📊</span>
              </div>
              <span className="font-bold text-xl text-gray-800">Text Comparison Analysis</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
              Change Analysis & Comparison
            </h1>
            <p className="text-base lg:text-lg text-gray-600 max-w-3xl mx-auto">
              See exactly what changed and why each improvement makes your {comparisonData.context.textType} more effective
            </p>
          </div>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="mb-8 bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-lg font-semibold text-gray-800">Analyzing Changes...</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
              <div className="text-sm text-gray-600 font-mono whitespace-pre-wrap">
                {analysisProgress || "Starting analysis..."}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {analysisResult && (
          <div className="space-y-8">
            {/* Summary */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Analysis Summary</h2>
              <p className="text-gray-600 mb-4">{analysisResult.summary}</p>
              
              {analysisResult.overallImprovements.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Key Improvements:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResult.overallImprovements.map((improvement, index) => (
                      <li key={index} className="text-gray-600">{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Side-by-Side Comparison */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Original Text */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">📝 Original Text</h2>
                </div>
                <div className="p-6">
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightChanges(comparisonData.originalText, analysisResult.changes, true) 
                    }}
                  />
                </div>
              </div>

              {/* Rewritten Text */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">✨ Improved Text</h2>
                </div>
                <div className="p-6">
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightChanges(comparisonData.rewrittenText, analysisResult.changes, false) 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Changes */}
            {analysisResult.changes.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">🔍 Detailed Change Analysis</h2>
                <div className="space-y-4">
                  {analysisResult.changes.map((change) => (
                    <div key={change.id} className={`border rounded-lg p-4 ${getChangeTypeColor(change.type)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getChangeTypeIcon(change.type)}</span>
                          <span className="font-medium capitalize">{change.type}</span>
                          <div className={`w-2 h-2 rounded-full ${getImportanceColor(change.importance)}`}></div>
                          <span className="text-xs uppercase font-medium">{change.importance}</span>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-xs font-medium mb-1 text-red-700">Before:</div>
                          <div className="bg-red-50 p-2 rounded text-sm">{change.originalPhrase}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1 text-green-700">After:</div>
                          <div className="bg-green-50 p-2 rounded text-sm">{change.rewrittenPhrase}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm leading-relaxed">
                        <span className="font-medium">Why this improves the text:</span> {change.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
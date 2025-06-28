export interface AnalysisContext {
  tone?: string;
  purpose?: string;
  audience?: string;
}

export interface AnalysisResult {
  id: string;
  originalText: string;
  detectedTextType: string;
  extractedContext: AnalysisContext;
  retrievedInstructions: string;
  recommendations: string[];
  readyToRewrite: boolean;
  timestamp: Date;
}

export interface RewriteRequest {
  analysisId: string;
  originalText: string;
  instructions: string;
  context: {
    textType: string;
    tone?: string;
    purpose?: string;
    audience?: string;
  };
}

export interface AnalysisMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AnalysisResponse {
  conversationMessage?: {
    role: "assistant";
    content: string;
  };
  analysisResult?: AnalysisResult;
  isComplete: boolean;
}

export interface RewriteResponse {
  originalText: string;
  rewrittenText: string;
  explanation: string;
  changesHighlighted: {
    before: string;
    after: string;
    changeType: string;
    reason: string;
  }[];
}

export interface Change {
  id: string;
  type: 'grammar' | 'tone' | 'structure' | 'clarity' | 'conciseness' | 'impact';
  originalPhrase: string;
  rewrittenPhrase: string;
  explanation: string;
  startPos: number;
  endPos: number;
  importance: 'high' | 'medium' | 'low';
}

export interface ChangeAnalysisResponse {
  changes: Change[];
  summary: string;
  overallImprovements: string[];
}

export interface ComparisonData {
  originalText: string;
  rewrittenText: string;
  context: {
    textType: string;
    tone?: string;
    purpose?: string;
    audience?: string;
  };
}
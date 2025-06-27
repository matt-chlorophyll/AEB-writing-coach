import { VectorizeService } from "@/lib/vectorize";
import type { ChatSource } from "@/types/chat";

export interface RetrievalResult {
  contextDocuments: string;
  sources: ChatSource[];
}

export class RetrievalService {
  private vectorizeService: VectorizeService;

  constructor() {
    this.vectorizeService = new VectorizeService();
  }

  async retrieveContext(query: string): Promise<RetrievalResult> {
    try {
      const documents = await this.vectorizeService.retrieveDocuments(query);
      const contextDocuments =
        this.vectorizeService.formatDocumentsForContext(documents);
      const sources =
        this.vectorizeService.convertDocumentsToChatSources(documents);

      return {
        contextDocuments,
        sources,
      };
    } catch (error) {
      console.error("Retrieval failed:", error);
      return {
        contextDocuments: "Unable to retrieve relevant documents at this time.",
        sources: [],
      };
    }
  }

  async searchDocuments(
    query: string, 
    textType?: string,
    additionalContext?: {
      tone?: string;
      purpose?: string;
      audience?: string;
    }
  ): Promise<string> {
    // Enhance the query with text type and context information
    let enhancedQuery = query;
    
    if (textType) {
      enhancedQuery = `${textType} rewriting instructions: ${query}`;
    }
    
    if (additionalContext) {
      const contextParts = [];
      if (additionalContext.tone) {
        contextParts.push(`tone: ${additionalContext.tone}`);
      }
      if (additionalContext.purpose) {
        contextParts.push(`purpose: ${additionalContext.purpose}`);
      }
      if (additionalContext.audience) {
        contextParts.push(`audience: ${additionalContext.audience}`);
      }
      
      if (contextParts.length > 0) {
        enhancedQuery += ` (${contextParts.join(', ')})`;
      }
    }
    
    const result = await this.retrieveContext(enhancedQuery);
    return result.contextDocuments || "No relevant documents found.";
  }

  // Keep the original method for backward compatibility
  async searchDocumentsSimple(query: string): Promise<string> {
    return this.searchDocuments(query);
  }
}

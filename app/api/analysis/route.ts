import { Agent, Runner, tool } from "@openai/agents";
import { openai } from "@ai-sdk/openai";
import { aisdk } from "@openai/agents-extensions";
import { z } from "zod";
import { RetrievalService } from "@/lib/retrieval";
import type { AnalysisMessage, AnalysisResult } from "@/types/analysis";

export async function POST(req: Request) {
  try {
    const { messages }: { messages: AnalysisMessage[] } = await req.json();

    const model = aisdk(openai("gpt-4o"));

    const analysisAgent = new Agent({
      name: "Text Analysis Agent",
      instructions: `You are an expert writing analysis agent that helps users understand their text and prepares it for rewriting.

Your role is to:

1. **ANALYZE THE TEXT**: When a user provides text, carefully examine it to identify:
   - Text type (email, LinkedIn post, blog article, marketing copy, etc.)
   - Current tone (formal, casual, professional, friendly, etc.)
   - Apparent purpose (networking, sales, information sharing, etc.)
   - Target audience (professionals, customers, general public, etc.)

2. **SEARCH FOR INSTRUCTIONS**: Use the searchDocuments tool to find relevant rewriting guidelines based on:
   - The detected text type
   - The user's rewriting goals
   - Any specific requirements mentioned

3. **PROVIDE ANALYSIS**: Give the user a clear summary of:
   - What type of text you detected
   - The current characteristics (tone, purpose, audience)
   - What rewriting instructions you found
   - Specific recommendations for improvement

4. **PREPARE FOR REWRITING**: Once you've completed your analysis and found relevant instructions, end your response naturally with a helpful conclusion. Then add a blank line, followed by the exact text "---ANALYSIS_DATA_START---" on its own line, then provide a JSON object containing your analysis data, then "---ANALYSIS_DATA_END---" on its own line.

The JSON format should be: {"textType": "detected type", "tone": "detected tone", "purpose": "detected purpose", "audience": "target audience", "instructions": "retrieved instructions summary", "recommendations": ["list", "of", "recommendations"]}

Example ending:
"I'm ready to help you rewrite this text using these guidelines.

---ANALYSIS_DATA_START---
{"textType": "LinkedIn post", "tone": "friendly", "purpose": "networking", "audience": "professionals", "instructions": "summary of retrieved guidelines", "recommendations": ["improvement 1", "improvement 2"]}
---ANALYSIS_DATA_END---"

Important guidelines:
- Be conversational and helpful in your explanations
- Ask clarifying questions if the text type or goals are unclear
- Focus on understanding the user's intent before searching for instructions
- Provide specific, actionable recommendations
- Always search for relevant documents before completing the analysis`,

      model,
      tools: [
        tool({
          name: "searchDocuments",
          description: "Search through proprietary document sources for rewriting instructions based on text type and context",
          parameters: z.object({
            query: z.string().describe("The main search query to find relevant documents"),
            textType: z.string().nullable().describe("The type of text being analyzed (e.g., 'LinkedIn post', 'email', 'blog post', 'marketing copy'). Use null if not specified."),
            tone: z.string().nullable().describe("The desired tone (e.g., 'professional', 'casual', 'persuasive', 'friendly'). Use null if not specified."),
            purpose: z.string().nullable().describe("The purpose of the text (e.g., 'networking', 'sales', 'informational', 'promotional'). Use null if not specified."),
            audience: z.string().nullable().describe("The target audience (e.g., 'professionals', 'customers', 'colleagues', 'general public'). Use null if not specified."),
          }),
          execute: async ({ query, textType, tone, purpose, audience }) => {
            const retrievalService = new RetrievalService();
            const additionalContext = {
              ...(tone && { tone }),
              ...(purpose && { purpose }),
              ...(audience && { audience }),
            };
            
            const documents = await retrievalService.searchDocuments(
              query, 
              textType || undefined,
              Object.keys(additionalContext).length > 0 ? additionalContext : undefined
            );
            
            return `Search completed for query: "${query}"${textType ? ` (Text type: ${textType})` : ''}${Object.keys(additionalContext).length > 0 ? ` (Context: ${JSON.stringify(additionalContext)})` : ''}. 

Retrieved instructions: ${documents}`;
          },
        })
      ],
    });

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== "user") {
      return Response.json(
        { error: "Invalid message format" },
        { status: 400 }
      );
    }

    const runner = new Runner({
      model,
    });

    const stream = await runner.run(analysisAgent, latestMessage.content, {
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const textStream = stream.toTextStream({
            compatibleWithNodeStreams: false,
          });

          let fullResponse = "";
          let displayResponse = "";
          
          for await (const chunk of textStream) {
            fullResponse += chunk;
            
            // Stream ALL chunks to frontend (no filtering during streaming)
            const conversationData = `data: ${JSON.stringify({ 
              type: "conversation",
              content: chunk 
            })}\n\n`;
            controller.enqueue(encoder.encode(conversationData));
          }

          await stream.completed;

          // Check if analysis is complete using new format
          if (fullResponse.includes("---ANALYSIS_DATA_END---")) {
            console.log("Found analysis data markers");
            
            // First, send cleanup signal to remove markers from frontend
            const cleanupData = `data: ${JSON.stringify({ 
              type: "cleanup_markers",
              markers: ["---ANALYSIS_DATA_START---", "---ANALYSIS_DATA_END---"]
            })}\n\n`;
            controller.enqueue(encoder.encode(cleanupData));
            
            try {
              // Extract JSON from between the markers
              const dataMatch = fullResponse.match(
                /---ANALYSIS_DATA_START---\s*([\s\S]*?)\s*---ANALYSIS_DATA_END---/
              );
              
              if (dataMatch) {
                console.log("Found analysis data:", dataMatch[1]);
                const analysisData = JSON.parse(dataMatch[1]);
                
                // Create structured analysis result
                const analysisResult: AnalysisResult = {
                  id: Date.now().toString(),
                  originalText: latestMessage.content,
                  detectedTextType: analysisData.textType || "Unknown",
                  extractedContext: {
                    tone: analysisData.tone || null,
                    purpose: analysisData.purpose || null,
                    audience: analysisData.audience || null,
                  },
                  retrievedInstructions: analysisData.instructions || "",
                  recommendations: analysisData.recommendations || [],
                  readyToRewrite: true,
                  timestamp: new Date(),
                };

                console.log("Successfully created analysis result");
                // Send analysis complete signal
                const completeData = `data: ${JSON.stringify({ 
                  type: "analysis_complete",
                  analysisResult 
                })}\n\n`;
                controller.enqueue(encoder.encode(completeData));
              } else {
                console.log("No valid data found between markers");
              }
            } catch (parseError) {
              console.error("Failed to parse analysis result:", parseError);
              console.log("Full response for debugging:", fullResponse);
            }
          } else {
            console.log("No analysis data markers found in response");
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Analysis streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in analysis endpoint:", error);
    return Response.json(
      { error: "Failed to process analysis request" },
      { status: 500 }
    );
  }
}
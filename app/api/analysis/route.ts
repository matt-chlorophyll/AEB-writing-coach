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
      instructions: `You are a text analysis specialist. Your job is simple:

1. **ANALYZE** the user's text to identify:
   - Text type (email, LinkedIn post, blog post, etc.)
   - Current tone and style
   - Purpose and target audience

2. **SEARCH** for relevant writing guidelines using the searchDocuments tool

3. **COMPLETE** your analysis by calling the completeAnalysis tool with your findings

IMPORTANT: You MUST call the completeAnalysis tool at the end to finish your work. Do not continue the conversation after calling completeAnalysis.

Be helpful and concise in your analysis.`,

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
        }),
        tool({
          name: "completeAnalysis",
          description: "REQUIRED: Call this tool to finish your analysis. This must be your final action.",
          parameters: z.object({
            textType: z.string().describe("The detected text type (e.g., 'LinkedIn post', 'email', 'blog post')"),
            tone: z.string().nullable().describe("The detected or desired tone (e.g., 'professional', 'casual', 'friendly')"),
            purpose: z.string().nullable().describe("The purpose of the text (e.g., 'networking', 'sales', 'informational')"),
            audience: z.string().nullable().describe("The target audience (e.g., 'professionals', 'customers', 'colleagues')"),
            summary: z.string().describe("Brief summary of your analysis findings"),
            recommendations: z.array(z.string()).describe("List of specific recommendations for improvement"),
          }),
          execute: async ({ textType, tone, purpose, audience, summary, recommendations }) => {
            // This tool execution signals completion and provides structured data
            const analysisData = {
              textType,
              tone,
              purpose,
              audience,
              summary,
              recommendations,
            };
            
            // Return a special completion signal that we can detect in the text
            return `🔄 ANALYSIS_COMPLETE_TOOL_CALL: ${JSON.stringify(analysisData)} 🔄`;
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
            
            // Check if this chunk contains tool call markers
            if (!chunk.includes("🔄 ANALYSIS_COMPLETE_TOOL_CALL:")) {
              // This is regular conversation content, send it to frontend
              displayResponse += chunk;
              const conversationData = `data: ${JSON.stringify({ 
                type: "conversation",
                content: chunk 
              })}\n\n`;
              controller.enqueue(encoder.encode(conversationData));
            }
            // If chunk contains tool markers, don't send to frontend but keep in fullResponse
          }

          await stream.completed;

          console.log("Analysis stream completed. Full response length:", fullResponse.length);
          console.log("Looking for completion signal in response...");

          // Check if analysis was completed via the completeAnalysis tool
          if (fullResponse.includes("🔄 ANALYSIS_COMPLETE_TOOL_CALL:")) {
            console.log("Found completion signal!");
            try {
              // Extract JSON from the tool call response
              const toolCallMatch = fullResponse.match(/🔄 ANALYSIS_COMPLETE_TOOL_CALL: (.*?) 🔄/s);
              if (toolCallMatch) {
                const analysisData = JSON.parse(toolCallMatch[1]);
                
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
                  retrievedInstructions: analysisData.summary + "\n\nBased on the analysis above, relevant writing instructions have been retrieved from the document search.", // Use summary + note about retrieved instructions
                  recommendations: analysisData.recommendations || [],
                  readyToRewrite: true,
                  timestamp: new Date(),
                };

                // Send analysis complete signal
                const completeData = `data: ${JSON.stringify({ 
                  type: "analysis_complete",
                  analysisResult 
                })}\n\n`;
                controller.enqueue(encoder.encode(completeData));
              }
            } catch (parseError) {
              console.error("Failed to parse analysis result:", parseError);
            }
          } else {
            console.log("No completion signal found. Response preview:", fullResponse.substring(0, 200) + "...");
            console.log("Agent may not have called completeAnalysis tool properly.");
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
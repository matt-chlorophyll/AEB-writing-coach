import { Agent, Runner, tool } from "@openai/agents";
import { openai } from "@ai-sdk/openai";
import { aisdk } from "@openai/agents-extensions";
import { z } from "zod";
import { RetrievalService } from "@/lib/retrieval";

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: AgentMessage[] } = await req.json();

    const model = aisdk(openai("gpt-4o"));

    const agent = new Agent({
      name: "AI SDK Agent Assistant",
      instructions: `You are an expert writing coach that specializes in text rewriting across different formats and platforms. You have access to proprietary document sources containing specific rewriting instructions for various text types.

      Your workflow should be:
      
      1. **TEXT TYPE DETECTION**: First, analyze the user's input to identify the type of text they want to rewrite or the target format they need. Common types include:
         - LinkedIn posts (professional social media)
         - Emails (formal, informal, marketing, cold outreach)
         - Blog posts or articles
         - Marketing copy or advertisements
         - Academic or technical writing
         - Social media posts (Twitter, Facebook, Instagram)
         - Business proposals or reports
         - Cover letters or resumes
         - Press releases
         - Product descriptions
      
      2. **TARGETED RETRIEVAL**: Based on the detected text type, search for specific rewriting instructions using targeted queries that include:
         - The identified text type/format
         - The user's specific goal or context
         - Any style or tone requirements mentioned
      
      3. **CONTEXTUAL REWRITING**: Apply the retrieved instructions to provide:
         - A rewritten version that follows the specific guidelines for that text type
         - Clear explanation of which rewriting principles were applied
         - Reference to the specific instruction sources used
         - Alternative versions if multiple approaches are viable
      
      4. **CLARIFICATION**: If the text type is ambiguous, ask the user to clarify the intended format or purpose before proceeding with retrieval and rewriting.
      
      Always be explicit about what type of text you've identified and which specific rewriting instructions you're applying.`,
      model,
      tools: [
        tool({
          name: "searchDocuments",
          description:
            "Search through proprietary document sources for rewriting instructions based on text type and context",
          parameters: z.object({
            query: z
              .string()
              .describe("The main search query to find relevant documents"),
            textType: z
              .string()
              .nullable()
              .describe("The type of text being rewritten (e.g., 'LinkedIn post', 'email', 'blog post', 'marketing copy'). Use null if not specified."),
            tone: z
              .string()
              .nullable()
              .describe("The desired tone (e.g., 'professional', 'casual', 'persuasive', 'friendly'). Use null if not specified."),
            purpose: z
              .string()
              .nullable()
              .describe("The purpose of the text (e.g., 'networking', 'sales', 'informational', 'promotional'). Use null if not specified."),
            audience: z
              .string()
              .nullable()
              .describe("The target audience (e.g., 'professionals', 'customers', 'colleagues', 'general public'). Use null if not specified."),
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
            
            return `Search completed for query: "${query}"${textType ? ` (Text type: ${textType})` : ''}${Object.keys(additionalContext).length > 0 ? ` (Context: ${JSON.stringify(additionalContext)})` : ''}. Documents retrieved: ${documents}`;
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

    const stream = await runner.run(agent, latestMessage.content, {
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const textStream = stream.toTextStream({
            compatibleWithNodeStreams: false,
          });

          for await (const chunk of textStream) {
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          await stream.completed;
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
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
    console.error("Error in agents SDK endpoint:", error);
    return Response.json(
      { error: "Failed to process request with Agents SDK" },
      { status: 500 }
    );
  }
}

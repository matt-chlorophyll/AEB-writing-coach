import { Agent, Runner } from "@openai/agents";
import { openai } from "@ai-sdk/openai";
import { aisdk } from "@openai/agents-extensions";
import type { RewriteRequest } from "@/types/analysis";

interface RewriteResponse {
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

export async function POST(req: Request) {
  try {
    const rewriteRequest: RewriteRequest = await req.json();

    const { originalText, instructions, context } = rewriteRequest;

    if (!originalText || !instructions) {
      return Response.json(
        { error: "Missing required fields: originalText and instructions" },
        { status: 400 }
      );
    }

    const model = aisdk(openai("gpt-4o"));

    const rewritingAgent = new Agent({
      name: "Text Rewriting Specialist",
      instructions: `You are an expert text rewriting specialist focused on helping ESL (English as Second Language) speakers improve their writing.

**YOUR ROLE:**
You receive analyzed text along with specific rewriting instructions and context. Your job is to rewrite the text following those instructions while making it more effective and natural.

**INPUT DATA:**
- Original text to rewrite
- Retrieved writing instructions from document sources
- Context: text type (${context.textType}), tone (${context.tone || 'not specified'}), purpose (${context.purpose || 'not specified'}), audience (${context.audience || 'not specified'})

**REWRITING GUIDELINES:**

1. **Follow the Instructions**: Apply the specific guidelines found in the retrieved documents
2. **Improve Clarity**: Make the text clearer and more natural for native English speakers
3. **Maintain Voice**: Keep the author's intended meaning and personal voice
4. **ESL-Friendly**: Focus on common ESL improvement areas:
   - Grammar and sentence structure
   - Word choice and vocabulary
   - Flow and coherence
   - Cultural appropriateness
   - Professional tone when needed

**OUTPUT FORMAT:**
Provide your response in this exact structure:

**REWRITTEN TEXT:**
[The improved version here]

**EXPLANATION:**
[Brief explanation of the key changes you made and why they improve the text]

**KEY IMPROVEMENTS:**
- [Specific improvement 1]
- [Specific improvement 2] 
- [etc.]

Be encouraging and constructive in your explanations, helping the user understand why the changes make the text better.`,

      model,
      // No tools needed - this agent works purely with the provided context
      tools: [],
    });

    const rewritePrompt = `Please rewrite the following text using these guidelines:

**ORIGINAL TEXT:**
"${originalText}"

**WRITING INSTRUCTIONS:**
${instructions}

**CONTEXT:**
- Text Type: ${context.textType}
- Tone: ${context.tone || 'Not specified'}
- Purpose: ${context.purpose || 'Not specified'}
- Target Audience: ${context.audience || 'Not specified'}

Please apply the writing instructions to improve this text while keeping it natural and appropriate for the context.`;

    const runner = new Runner({
      model,
    });

    const stream = await runner.run(rewritingAgent, rewritePrompt, {
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

          for await (const chunk of textStream) {
            fullResponse += chunk;
            
            // Stream each chunk as it comes
            const data = `data: ${JSON.stringify({ 
              type: "rewrite_chunk",
              content: chunk 
            })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          await stream.completed;

          // Parse the final response to extract structured data
          try {
            const rewrittenTextMatch = fullResponse.match(/\*\*REWRITTEN TEXT:\*\*\s*([\s\S]*?)\s*\*\*EXPLANATION:\*\*/);
            const explanationMatch = fullResponse.match(/\*\*EXPLANATION:\*\*\s*([\s\S]*?)\s*\*\*KEY IMPROVEMENTS:\*\*/);
            const improvementsMatch = fullResponse.match(/\*\*KEY IMPROVEMENTS:\*\*\s*([\s\S]*?)$/);

            const rewriteResponse: RewriteResponse = {
              originalText,
              rewrittenText: rewrittenTextMatch ? rewrittenTextMatch[1].trim() : fullResponse,
              explanation: explanationMatch ? explanationMatch[1].trim() : "Text has been rewritten according to the provided guidelines.",
              changesHighlighted: [] // Could be enhanced later to show specific changes
            };

            // Send the structured result
            const resultData = `data: ${JSON.stringify({ 
              type: "rewrite_complete",
              result: rewriteResponse 
            })}\n\n`;
            controller.enqueue(encoder.encode(resultData));

          } catch (parseError) {
            console.error("Failed to parse rewrite response:", parseError);
            
            // Fallback response
            const fallbackResponse: RewriteResponse = {
              originalText,
              rewrittenText: fullResponse,
              explanation: "Text has been rewritten according to the provided guidelines.",
              changesHighlighted: []
            };

            const fallbackData = `data: ${JSON.stringify({ 
              type: "rewrite_complete",
              result: fallbackResponse 
            })}\n\n`;
            controller.enqueue(encoder.encode(fallbackData));
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Rewriting streaming error:", error);
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
    console.error("Error in rewrite endpoint:", error);
    return Response.json(
      { error: "Failed to process rewrite request" },
      { status: 500 }
    );
  }
}
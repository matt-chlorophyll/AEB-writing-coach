import { Agent, Runner } from "@openai/agents";
import { openai } from "@ai-sdk/openai";
import { aisdk } from "@openai/agents-extensions";

interface ChangeAnalysisRequest {
  originalText: string;
  rewrittenText: string;
  context?: {
    textType?: string;
    tone?: string;
    purpose?: string;
    audience?: string;
  };
}

interface Change {
  id: string;
  type: 'grammar' | 'tone' | 'structure' | 'clarity' | 'conciseness' | 'impact';
  originalPhrase: string;
  rewrittenPhrase: string;
  explanation: string;
  startPos: number;
  endPos: number;
  importance: 'high' | 'medium' | 'low';
}

interface ChangeAnalysisResponse {
  changes: Change[];
  summary: string;
  overallImprovements: string[];
}

export async function POST(req: Request) {
  try {
    const { originalText, rewrittenText, context }: ChangeAnalysisRequest = await req.json();

    if (!originalText || !rewrittenText) {
      return Response.json(
        { error: "Missing required fields: originalText and rewrittenText" },
        { status: 400 }
      );
    }

    const model = aisdk(openai("gpt-4o"));

    const analysisAgent = new Agent({
      name: "Text Change Analyzer",
      instructions: `You are an expert writing analyst that compares original and rewritten texts to identify and explain changes.

**YOUR TASK:**
Compare the original text with the rewritten version and identify all meaningful changes. For each change, explain why it improves the text.

**ANALYSIS CATEGORIES:**
- 🔧 **grammar**: Grammar fixes, punctuation, verb tenses
- 🎭 **tone**: Professional vs casual, formality adjustments  
- 🏗️ **structure**: Sentence reorganization, flow improvements
- 💡 **clarity**: Making ideas clearer and easier to understand
- ✂️ **conciseness**: Removing redundancy, making text more concise
- 🎯 **impact**: More engaging, persuasive, or compelling language

**OUTPUT FORMAT:**
Provide your analysis in this exact JSON structure:

{
  "changes": [
    {
      "type": "grammar|tone|structure|clarity|conciseness|impact",
      "originalPhrase": "exact phrase from original",
      "rewrittenPhrase": "exact phrase from rewritten", 
      "explanation": "clear explanation of why this change improves the text",
      "importance": "high|medium|low"
    }
  ],
  "summary": "Brief summary of overall improvements made",
  "overallImprovements": [
    "Key improvement 1",
    "Key improvement 2",
    "Key improvement 3"
  ]
}

**GUIDELINES:**
- Focus on meaningful changes, not minor word variations
- Explain the writing principle behind each change
- Be specific about how each change improves the text
- Consider the context: ${context?.textType || 'general text'} for ${context?.audience || 'general audience'}
- Prioritize changes by importance (high/medium/low)`,

      model,
      tools: [],
    });

    const analysisPrompt = `Please analyze the changes between these two texts:

**ORIGINAL TEXT:**
"${originalText}"

**REWRITTEN TEXT:**
"${rewrittenText}"

**CONTEXT:**
- Text Type: ${context?.textType || 'Not specified'}
- Intended Tone: ${context?.tone || 'Not specified'}
- Purpose: ${context?.purpose || 'Not specified'}
- Target Audience: ${context?.audience || 'Not specified'}

Provide a detailed analysis of all meaningful changes and explain how each improvement enhances the text quality.`;

    const runner = new Runner({
      model,
    });

    const stream = await runner.run(analysisAgent, analysisPrompt, {
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
            
            // Stream progress to frontend
            const progressData = `data: ${JSON.stringify({ 
              type: "analysis_progress",
              content: chunk 
            })}\n\n`;
            controller.enqueue(encoder.encode(progressData));
          }

          await stream.completed;

          // Parse the JSON response from the agent
          try {
            // Extract JSON from the response
            const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const analysisData = JSON.parse(jsonMatch[0]);
              
              // Add unique IDs and positions to changes
              const changesWithIds = analysisData.changes.map((change: any, index: number) => ({
                id: `change-${index + 1}`,
                ...change,
                startPos: 0, // We'll calculate this on the frontend
                endPos: 0    // We'll calculate this on the frontend
              }));

              const result: ChangeAnalysisResponse = {
                changes: changesWithIds,
                summary: analysisData.summary || "Analysis completed successfully.",
                overallImprovements: analysisData.overallImprovements || []
              };

              // Send the final result
              const resultData = `data: ${JSON.stringify({ 
                type: "analysis_complete",
                result: result 
              })}\n\n`;
              controller.enqueue(encoder.encode(resultData));
            } else {
              throw new Error("No valid JSON found in response");
            }
          } catch (parseError) {
            console.error("Failed to parse analysis response:", parseError);
            console.log("Full response:", fullResponse);
            
            // Fallback response
            const fallbackResult: ChangeAnalysisResponse = {
              changes: [],
              summary: "Text analysis completed. The rewritten version shows improvements in clarity, tone, and structure.",
              overallImprovements: [
                "Enhanced professional tone",
                "Improved clarity and readability",
                "Better structure and flow"
              ]
            };

            const fallbackData = `data: ${JSON.stringify({ 
              type: "analysis_complete",
              result: fallbackResult 
            })}\n\n`;
            controller.enqueue(encoder.encode(fallbackData));
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Change analysis streaming error:", error);
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
    console.error("Error in change analysis endpoint:", error);
    return Response.json(
      { error: "Failed to process change analysis request" },
      { status: 500 }
    );
  }
}
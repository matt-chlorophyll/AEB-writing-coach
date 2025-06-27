import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { RetrievalService } from "@/lib/retrieval";
import type { ChatSource } from "@/types/chat";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const userMessage = messages[messages.length - 1];
    let contextDocuments = "";
    let sources: ChatSource[] = [];

    if (userMessage?.role === "user" && userMessage?.content) {
      const retrievalService = new RetrievalService();
      const result = await retrievalService.retrieveContext(
        userMessage.content
      );
      contextDocuments = result.contextDocuments;
      sources = result.sources;
    }

    const systemPrompt = `You are a helpful AI assistant that specializes in answering questions user have based on sources.

When answering questions, use the following context documents to provide accurate and relevant information:

=== CONTEXT DOCUMENTS ===
${contextDocuments}
=== END CONTEXT DOCUMENTS ===

Please base your responses on the context provided above when relevant. If the context doesn't contain information to answer the question, acknowledge this and provide general knowledge while being clear about what information comes from the context vs. your general knowledge
Keep your answer to less than 10 sentences.
.`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
    });

    // Return both the text response and sources
    return Response.json({
      role: "assistant",
      content: result.text,
      sources: sources,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return Response.json({ error: "Failed to process chat" }, { status: 500 });
  }
}

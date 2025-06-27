export interface ChatSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  relevancy?: number;
  similarity?: number;
}

export interface ChatMessageWithSources {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  createdAt: string | Date;
}

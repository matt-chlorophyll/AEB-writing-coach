"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatSource } from "@/types/chat";
import SourcesDisplay from "./sources-display";
import { loadingMessages } from "@/lib/consts";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

interface MessageWithSources extends Message {
  sources?: ChatSource[];
}

export default function Chat() {
  const [messages, setMessages] = useState<MessageWithSources[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isLoading) return;

    // Set initial random message
    setLoadingMessage(
      loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
    );

    const changeMessage = () => {
      setLoadingMessage((prev) => {
        // Get a different message than the current one
        let newMessage;
        do {
          newMessage =
            loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        } while (newMessage === prev && loadingMessages.length > 1);
        return newMessage;
      });
    };

    // Random interval between 1.5 and 3.5 seconds
    const getRandomInterval = () => 1500 + Math.random() * 2000;

    let timeoutId: NodeJS.Timeout;
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        changeMessage();
        scheduleNext();
      }, getRandomInterval());
    };

    scheduleNext();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(
            ({ id, createdAt, ...msg }) => msg
          ),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: MessageWithSources = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.content,
        sources: data.sources || [],
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border p-4">
        <h1 className="text-xl font-semibold text-foreground">Chat</h1>
      </header>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8">
            <p>Start a conversation by typing a message below.</p>
            <p className="text-xs mt-2">
              Ask about vectorization, embeddings, or RAG systems!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="max-w-md lg:max-w-2xl">
                  {/* Sources at the top for assistant messages */}
                  {message.role === "assistant" &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <SourcesDisplay sources={message.sources} />
                    )}

                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(
                        message.createdAt || Date.now()
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted max-w-md lg:max-w-2xl px-4 py-3 rounded-lg">
              <div className="flex items-center gap-3">
                {/* Animated AI icon */}
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="relative flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="text-primary text-sm animate-pulse">
                      🤖
                    </span>
                  </div>
                </div>

                {/* Loading text and animation */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      key={loadingMessage}
                      className="text-sm text-muted-foreground animate-fade-in"
                    >
                      {loadingMessage}
                    </span>
                    <div className="flex gap-0.5">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

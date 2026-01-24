"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  data?: {
    collectionsUsed?: string[];
    analysis?: unknown;
  };
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/aiQuery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        data: {
          collectionsUsed: data.collectionsUsed,
          analysis: data.analysis,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (_error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error processing your request. ${_error instanceof Error ? _error.message : ""}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto border rounded-lg p-6 bg-white shadow-lg">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Medical AI Assistant
        </h2>
        <p className="text-sm text-gray-600">
          Ask about patients, appointments, billing, or lab results
        </p>
      </div>

      {/* Messages */}
      <div className="space-y-4 h-80 overflow-y-auto mb-4 p-4 border rounded-lg bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>How can I help you today?</p>
            <p className="text-sm mt-2">
              Try asking about recent appointments, billing status, or lab
              results
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg max-w-[80%] ${msg.role === "user" ? "bg-blue-100 ml-auto" : "bg-white border"
                }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.data?.collectionsUsed && (
                <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-1">
                  <span>Sources:</span>
                  {msg.data.collectionsUsed.map(
                    (collection: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-200 rounded-full"
                      >
                        {collection}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border p-4 rounded-lg max-w-[80%]">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing medical data...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about recent appointments, pending lab results, billing summaries..."
          disabled={isLoading}
        />
        <Button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-6"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </div>
    </div>
  );
}

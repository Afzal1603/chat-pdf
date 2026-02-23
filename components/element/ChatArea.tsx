"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type Props = {
  chatId: number;
};

type DBMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function ChatArea({ chatId }: Props) {
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 🔥 Load chat history from DB
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/chat/${chatId}`);
        const data: DBMessage[] = await res.json();

        // Convert DB messages to AI SDK format
        const formatted = data.map((msg) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
        }));

        setInitialMessages(formatted);
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadMessages();
  }, [chatId]);

  // 🚀 Initialize useChat AFTER history is loaded
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    body: { chatId },
    initialMessages,
  });

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isLoaded) {
    return (
      <div className="h-210 flex items-center justify-center text-white">
        Loading chat...
      </div>
    );
  }

  return (
    <div className="h-218.5 bg-gradient-to-br from-[#0f1220] via-[#14172a] to-[#1b1f36]">
      <div className="mx-auto flex h-full max-w-2xl flex-col">
        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-6 space-y-6 scrollbar-custom">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role !== "user" && (
                <div className="mr-3 mt-1 h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                  AI
                </div>
              )}

              <div
                className={`px-4 py-3 max-w-[75%] rounded-2xl text-sm leading-relaxed shadow-md ${
                  message.role === "user"
                    ? "bg-violet-500 text-white rounded-br-none"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-none"
                }`}
              >
                {/* AI SDK now uses content directly */}
                {typeof message.content === "string"
                  ? message.content
                  : message.parts?.map((part: any, i: number) =>
                      part.type === "text" ? (
                        <div key={`${message.id}-${i}`}>{part.text}</div>
                      ) : null,
                    )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 border-t border-white/10 bg-[#0f1220]/95 backdrop-blur px-4 py-3"
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Message ChatGPT..."
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 text-zinc-100 placeholder-zinc-400 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              className="p-3 rounded-xl bg-violet-500 hover:bg-violet-600 transition text-white shadow-lg"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

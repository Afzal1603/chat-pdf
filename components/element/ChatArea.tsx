"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";

export default function ChatArea() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-md mx-auto h-full px-2 pb-4">
      {/* Scrollable message list */}
      <div className="flex-1 overflow-y-auto space-y-4 scrollbar-custom pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 max-w-[80%] rounded-2xl shadow break-words ${
                message.role === "user"
                  ? "bg-violet-300 text-black rounded-br-none"
                  : "bg-indigo-300 text-black dark:bg-zinc-800 dark:text-white rounded-bl-none"
              }`}
            >
              {message.parts.map((part, i) =>
                part.type === "text" ? (
                  <div key={`${message.id}-${i}`}>{part.text}</div>
                ) : null
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Box (always at bottom) */}
      <form onSubmit={handleSubmit} className="w-full pt-2">
        <input
          className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-800 bg-pink-300 text-pink-900 shadow focus:outline-none focus:ring-2 focus:ring-pink-500"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Loader2, FlaskConical } from "lucide-react";
import toast from "react-hot-toast";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type PDF = {
  id: number;
  pdfName: string;
  filekey: string;
};

type Props = {
  sessionId: number;
  pdfs: PDF[];
};

export default function ResearchChatArea({ sessionId, pdfs }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load existing messages
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/research/${sessionId}`);
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      } catch (err) {
        console.error("Failed to load research messages", err);
      } finally {
        setInitialLoaded(true);
      }
    }
    load();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: Date.now(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/research/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Query failed");
      }

      const { answer } = await res.json();
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: answer,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to get answer");
      // Remove optimistic user msg on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setInput(question);
    } finally {
      setLoading(false);
    }
  };

  if (!initialLoaded) {
    return (
      <div className="h-full flex items-center justify-center text-white/60">
        <Loader2 className="animate-spin mr-2" size={20} />
        Loading session...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0f1220] via-[#14172a] to-[#1b1f36]">
      {/* PDF badges */}
      <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-white/10 bg-[#0f1220]/80">
        <FlaskConical size={16} className="text-emerald-400 shrink-0 mt-0.5" />
        {pdfs.map((pdf) => (
          <span
            key={pdf.id}
            className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 truncate max-w-[180px]"
            title={pdf.pdfName}
          >
            {pdf.pdfName}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-2 space-y-6 scrollbar-custom">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/40 text-sm gap-2">
            <FlaskConical size={40} className="text-emerald-500/40" />
            <p>Ask a question to compare your research papers.</p>
            <p className="text-xs">
              Example: &quot;What methodologies do these papers use?&quot;
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="mr-3 mt-1 h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                AI
              </div>
            )}

            <div
              className={`
                max-w-[85%] rounded-2xl text-sm leading-relaxed shadow-md
                ${
                  message.role === "user"
                    ? "px-4 py-3 bg-violet-500 text-white rounded-br-none"
                    : "w-full px-4 py-3 bg-zinc-800 text-zinc-100 rounded-bl-none overflow-x-auto"
                }
              `}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none
                  prose-table:text-xs prose-th:text-emerald-300
                  prose-td:border prose-td:border-white/10 prose-th:border prose-th:border-white/10
                  prose-table:border-collapse">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="mr-3 mt-1 h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              AI
            </div>
            <div className="px-4 py-3 rounded-2xl bg-zinc-800 text-zinc-100 rounded-bl-none flex items-center gap-2 text-sm">
              <Loader2 size={14} className="animate-spin text-emerald-400" />
              Analyzing {pdfs.length} paper{pdfs.length > 1 ? "s" : ""}...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 border-t border-white/10 bg-[#0f1220]/95 backdrop-blur px-4 py-3"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Compare methodologies, findings, datasets..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 text-zinc-100 placeholder-zinc-400
              border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500
              disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition text-white shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-white/30 mt-1">
          Responses are formatted as comparison tables across all uploaded papers
        </p>
      </form>
    </div>
  );
}

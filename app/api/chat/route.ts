export const runtime = "nodejs"; // force node runtime for DB + streaming compatibility
export const maxDuration = 30;

import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { groq } from "@ai-sdk/groq";
import { Message, streamText } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("POST /api/chat - start");
  try {
    const body = await req.json();
    const { messages, chatId } = body ?? {};
    console.log("incoming body:", {
      messagesLength: Array.isArray(messages) ? messages.length : 0,
      chatId,
    });

    // validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.warn("Invalid messages");
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }
    if (chatId === undefined || chatId === null) {
      console.warn("Missing chatId");
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    const normalizedChatId =
      typeof chatId === "string" && /^\d+$/.test(chatId)
        ? Number(chatId)
        : chatId;

    console.log(
      "normalizedChatId:",
      normalizedChatId,
      "type:",
      typeof normalizedChatId
    );

    // Query DB
    const _chats = await db
      .select()
      .from(chats)
      .where(eq(chats.id, normalizedChatId));

    console.log("db query returned rows:", _chats?.length ?? 0);
    if (!_chats || _chats.length !== 1) {
      console.warn("Chat lookup returned:", _chats);
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const row = _chats[0];
    console.log("DB row for chat:", {
      id: row.id,
      file_key:
        (row as any).file_key ?? (row as any).filekey ?? (row as any).fileKey,
      createdAt: row.created_at,
    });

    const fileKey =
      (row as any).file_key ?? (row as any).filekey ?? (row as any).fileKey;
    if (!fileKey) {
      console.error("fileKey missing on DB row", row);
      return NextResponse.json(
        { error: "fileKey missing on chat row" },
        { status: 500 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    console.log("lastMessage role:", lastMessage?.role ?? null);

    // Potentially slow: getContext could fetch PDFs or remote storage — log time
    const t0 = Date.now();
    const context = await getContext(lastMessage.content, fileKey);
    const t1 = Date.now();
    console.log(
      `getContext completed in ${t1 - t0}ms, context length: ${
        String(context)?.length ?? 0
      }`
    );

    // prepare prompt
    const prompt = {
      role: "system",
      content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK
AI assistant will take into account any CONTEXT BLOCK...
      `,
    };

    // Attempt to stream
    console.log("Calling streamText to start streaming response...");
    let result;
    try {
      result = await streamText({
        model: groq("llama3-70b-8192"),
        messages: [
          prompt,
          ...messages.filter((m: Message) => m.role === "user"),
        ],
        system:
          "You are a helpful assistant. When the user provides some context or content, generate a concise summary.",
      });
      console.log(
        "streamText returned:",
        typeof result,
        result && Object.keys(result).slice(0, 10)
      );
    } catch (streamErr) {
      console.error("streamText threw synchronously:", streamErr);
      // fall through to a readable error response
      return NextResponse.json(
        { error: "Streaming failed", details: String(streamErr) },
        { status: 500 }
      );
    }

    // Primary: if SDK provides .toDataStreamResponse(), use it
    if (result && typeof (result as any).toDataStreamResponse === "function") {
      console.log("Using result.toDataStreamResponse()");
      try {
        return (result as any).toDataStreamResponse();
      } catch (respErr) {
        console.error("toDataStreamResponse threw:", respErr);
        // continue to fallback
      }
    }

    // Secondary: if the SDK returned a ReadableStream (or Node stream), return it directly
    if (result && typeof (result as any).getReader === "function") {
      console.log(
        "result looks like a ReadableStream — returning Response(stream)."
      );
      return new Response(result as any, { status: 200 });
    }

    // Fallback: if result has a 'text' or 'toString' or 'body' property, try to send that
    const possibleText =
      (result && (result.text || (result.toString && result.toString()))) ??
      null;
    if (possibleText) {
      console.log("Fallback: sending text from result");
      return new Response(String(possibleText), {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    console.error(
      "Unable to stream: unknown result shape",
      Object.keys(result ?? {})
    );
    return NextResponse.json(
      { error: "Unable to stream the response from model" },
      { status: 500 }
    );
  } catch (err) {
    console.error("POST /api/chat error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}

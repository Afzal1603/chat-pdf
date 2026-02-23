export const runtime = "nodejs";
export const maxDuration = 30;

import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { messages as messagesTable } from "@/lib/db/schema";
import { groq } from "@ai-sdk/groq";
import { Message, streamText } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("POST /api/chat - start");

  try {
    const body = await req.json();
    const { messages, chatId } = body ?? {};

    // ================= VALIDATION =================
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages must be a non-empty array" },
        { status: 400 },
      );
    }

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 },
      );
    }

    const normalizedChatId =
      typeof chatId === "string" && /^\d+$/.test(chatId)
        ? Number(chatId)
        : chatId;

    if (typeof normalizedChatId !== "number" || isNaN(normalizedChatId)) {
      return NextResponse.json(
        { error: "chatId must be a valid number" },
        { status: 400 },
      );
    }

    // ================= FETCH CHAT =================
    const rows = await db
      .select()
      .from(chats)
      .where(eq(chats.id, normalizedChatId));

    if (!rows || rows.length !== 1) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const chat = rows[0];

    if (!chat.filekey) {
      return NextResponse.json(
        { error: "File key missing for this chat" },
        { status: 500 },
      );
    }

    const fileKey = chat.filekey;

    // ================= GET LAST USER MESSAGE =================
    const userMessage = messages[messages.length - 1];

    if (!userMessage || !userMessage.content) {
      return NextResponse.json(
        { error: "Last message must have content" },
        { status: 400 },
      );
    }

    // ================= SAVE USER MESSAGE =================
    await db.insert(messagesTable).values({
      chatId: normalizedChatId,
      role: "user",
      content:
        typeof userMessage.content === "string"
          ? userMessage.content
          : JSON.stringify(userMessage.content),
    });

    // ================= RAG CONTEXT =================
    let context = "";
    try {
      context = await getContext(userMessage.content, fileKey);
    } catch (err) {
      console.error("Error getting context:", err);
    }

    // ================= SYSTEM PROMPT =================
    const systemPrompt = `
You are a polite, professional, and human-like AI assistant.

All responses must be written in natural plain text only. Do not use bullet points, numbered lists, headings, or formatting of any kind.

Begin every response with a brief, clear summary written in 2–4 natural sentences.

After the summary, smoothly ask the user if they would like more details.

Use available context silently and naturally when it exists. Never mention where the information comes from.

If certainty is not possible, communicate uncertainty politely.

Maintain a calm, respectful, and professional tone.
`;

    // ================= CLEAN MESSAGES =================
    const cleanedMessages: Message[] = messages.map((m: any) => ({
      role: m.role,
      content:
        typeof m.content === "string" ? m.content : JSON.stringify(m.content),
    }));

    const ragMessages: Message[] = [
      {
        role: "assistant",
        content: context
          ? `PDF CONTEXT:\n\n${context}`
          : `No PDF context was retrieved.`,
      },
      ...cleanedMessages,
    ];

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing in server environment" },
        { status: 500 },
      );
    }

    // ================= STREAM + SAVE ASSISTANT =================
    const result = streamText({
      model: groq("llama-3.1-8b-instant"),
      system: systemPrompt,
      messages: ragMessages,
    });

    const originalResponse = result.toDataStreamResponse();
    const reader = originalResponse.body?.getReader();

    if (!reader) {
      return NextResponse.json(
        { error: "Failed to create stream" },
        { status: 500 },
      );
    }

    let fullText = "";
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Pass through to client
            controller.enqueue(value);

            // Accumulate text
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("0:")) {
                try {
                  const textContent = JSON.parse(line.slice(2));
                  if (typeof textContent === "string") {
                    fullText += textContent;
                  }
                } catch {
                  // skip
                }
              }
            }
          }

          // ✅ SAVE BEFORE CLOSING THE STREAM
          if (fullText.trim()) {
            try {
              await db.insert(messagesTable).values({
                chatId: normalizedChatId,
                role: "assistant",
                content: fullText.trim(),
              });
              console.log("Assistant message saved successfully");
            } catch (err) {
              console.error("Failed to save assistant message:", err);
            }
          } else {
            console.log("No assistant text to save");
          }

          // ✅ Send a final empty chunk to keep connection alive during save
          controller.enqueue(new TextEncoder().encode(""));
          controller.close();
        } catch (err) {
          console.error("Stream processing error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: originalResponse.headers,
    });
  } catch (err: any) {
    console.error("POST /api/chat error:", err);

    return NextResponse.json(
      {
        error: "Internal server error",
        details: err.message || String(err),
      },
      { status: 500 },
    );
  }
}

import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await context.params; // ✅ await params

    const numericChatId = Number(chatId);

    if (isNaN(numericChatId)) {
      return NextResponse.json({ error: "Invalid chatId" }, { status: 400 });
    }

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, numericChatId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(chatMessages);
  } catch (err: any) {
    console.error("GET chat messages error:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

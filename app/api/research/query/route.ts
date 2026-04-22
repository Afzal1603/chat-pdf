export const runtime = "nodejs";
export const maxDuration = 30;

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchSessions, researchPdfs, researchMessages } from "@/lib/db/schema";
import { getResearchContext } from "@/lib/context";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { question, sessionId } = body as {
      question: string;
      sessionId: number;
    };

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    // Verify session belongs to this user
    const sessionRows = await db
      .select()
      .from(researchSessions)
      .where(
        and(
          eq(researchSessions.id, sessionId),
          eq(researchSessions.userId, userId),
        ),
      );

    if (!sessionRows.length) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch all PDFs in this session
    const pdfs = await db
      .select()
      .from(researchPdfs)
      .where(eq(researchPdfs.sessionId, sessionId));

    if (!pdfs.length) {
      return NextResponse.json({ error: "No PDFs in this session" }, { status: 400 });
    }

    // Save user message
    await db.insert(researchMessages).values({
      sessionId,
      role: "user",
      content: question,
    });

    // Get RAG context from all PDFs in parallel
    const contexts = await getResearchContext(
      question,
      pdfs.map((p) => ({ fileKey: p.filekey, pdfName: p.pdfName })),
    );

    // Build system prompt for comparison table
    const pdfNames = pdfs.map((p) => p.pdfName).join(", ");
    const contextBlock = contexts
      .map(
        ({ pdfName, context }) =>
          `=== ${pdfName} ===\n${context || "No relevant content found for this paper."}`,
      )
      .join("\n\n");

    const systemPrompt = `You are a research assistant specialized in comparing academic papers and research documents.

You have been given content extracted from ${pdfs.length} research paper(s): ${pdfNames}.

Your job is to answer the user's question by comparing information across all provided papers.

STRICT FORMATTING RULES:
1. Always respond with a properly formatted Markdown comparison table.
2. Table columns = one column per paper (use the paper name as column header).
3. Table rows = the key comparison aspects relevant to the question.
4. If information for a specific paper is unavailable for a row, write "N/A".
5. After the table, add a short 2-3 sentence summary paragraph.
6. Do NOT add any preamble or explanation before the table.

Here is the extracted content from each paper:

${contextBlock}`;

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    });

    const answer = text.trim();

    // Save assistant message
    await db.insert(researchMessages).values({
      sessionId,
      role: "assistant",
      content: answer,
    });

    return NextResponse.json({ answer }, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/research/query error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message || String(error) },
      { status: 500 },
    );
  }
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchMessages, researchSessions } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { sessionId: sessionIdStr } = await params;
    const sessionId = Number(sessionIdStr);

    if (isNaN(sessionId)) {
      return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    // Verify ownership
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

    const messages = await db
      .select()
      .from(researchMessages)
      .where(eq(researchMessages.sessionId, sessionId))
      .orderBy(asc(researchMessages.createdAt));

    return NextResponse.json(messages, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/research/[sessionId] error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message || String(error) },
      { status: 500 },
    );
  }
}

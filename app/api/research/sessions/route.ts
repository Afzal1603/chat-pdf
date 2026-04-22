import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchSessions, researchPdfs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sessions = await db
      .select()
      .from(researchSessions)
      .where(eq(researchSessions.userId, userId))
      .orderBy(desc(researchSessions.createdAt));

    // For each session, also grab its PDF list
    const sessionsWithPdfs = await Promise.all(
      sessions.map(async (session) => {
        const pdfs = await db
          .select()
          .from(researchPdfs)
          .where(eq(researchPdfs.sessionId, session.id));
        return { ...session, pdfs };
      }),
    );

    return NextResponse.json(sessionsWithPdfs, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/research/sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message || String(error) },
      { status: 500 },
    );
  }
}

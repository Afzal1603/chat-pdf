export const runtime = "nodejs";
export const maxDuration = 60;

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { researchSessions, researchPdfs } from "@/lib/db/schema";
import { loadS3ToPinecone } from "@/lib/pinecone/pinecone";
import { getS3Url } from "@/lib/s3/s3";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { files, title } = body as {
      files: { file_key: string; file_name: string }[];
      title?: string;
    };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "At least one file is required" },
        { status: 400 },
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 PDFs allowed per research session" },
        { status: 400 },
      );
    }

    // Embed each PDF into its own Pinecone namespace sequentially to avoid timeout
    console.log(`Processing ${files.length} PDFs for research session...`);
    for (const { file_key } of files) {
      console.log(`Embedding: ${file_key}`);
      await loadS3ToPinecone(file_key);
    }


    // Create the research session
    const sessionTitle =
      title ||
      (files.length === 1
        ? files[0].file_name
        : `${files[0].file_name} + ${files.length - 1} more`);

    const sessionRows = await db
      .insert(researchSessions)
      .values({ userId, title: sessionTitle })
      .returning({ id: researchSessions.id });

    const sessionId = sessionRows[0].id;

    // Store each PDF record
    await db.insert(researchPdfs).values(
      files.map(({ file_key, file_name }) => ({
        sessionId,
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        filekey: file_key,
      })),
    );

    console.log(`Research session ${sessionId} created with ${files.length} PDFs`);
    return NextResponse.json({ session_id: sessionId }, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/research/create error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message || String(error) },
      { status: 500 },
    );
  }
}

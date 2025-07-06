import { loadS3ToPinecone } from "@/lib/pinecone/pinecone";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getS3Url } from "@/lib/s3/s3";
import { chats } from "@/lib/db/schema";

export async function POST(req: Request, res: Response) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { file_key, file_name } = body;
    console.log(file_key, file_name);
    const pages = await loadS3ToPinecone(file_key);
    const chat_id = await db
      .insert(chats)
      .values({
        pdfName: file_name,
        pdfUrl: getS3Url(file_key),
        filekey: file_key,
        userId,
      })
      .returning({ id: chats.id });

    return NextResponse.json({ chat_id: chat_id[0].id }, { status: 200 });

    return NextResponse.json({ pages }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}

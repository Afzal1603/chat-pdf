import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { researchSessions, researchPdfs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { FlaskConical, ArrowLeft } from "lucide-react";
import ResearchChatArea from "@/components/element/ResearchChatArea";

type Props = {
  params: Promise<{ session_id: string }>;
};

const ResearchSessionPage = async ({ params }: Props) => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { session_id } = await params;
  const sessionId = Number(session_id);

  if (isNaN(sessionId)) notFound();

  // Fetch session + verify ownership
  const sessionRows = await db
    .select()
    .from(researchSessions)
    .where(
      and(
        eq(researchSessions.id, sessionId),
        eq(researchSessions.userId, userId),
      ),
    );

  if (!sessionRows.length) notFound();

  const session = sessionRows[0];

  const pdfs = await db
    .select()
    .from(researchPdfs)
    .where(eq(researchPdfs.sessionId, sessionId));

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0d1a15] via-[#0f1f1a] to-[#132620]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1a15]/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/research">
            <Button
              size="sm"
              className="bg-white/10 text-white border border-white/20 hover:bg-white/20 transition"
            >
              <ArrowLeft size={14} className="mr-1" />
              Sessions
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FlaskConical size={18} className="text-emerald-400" />
            <h1 className="text-lg font-bold text-white/90 truncate max-w-lg">
              {session.title}
            </h1>
          </div>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Chat Area – fills remaining height */}
      <div className="flex-1 min-h-0">
        <ResearchChatArea sessionId={sessionId} pdfs={pdfs} />
      </div>
    </div>
  );
};

export default ResearchSessionPage;

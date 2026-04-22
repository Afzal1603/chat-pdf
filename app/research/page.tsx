import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { researchSessions, researchPdfs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { FlaskConical, Plus, FileText } from "lucide-react";

const ResearchPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1f2333]">
        <p className="text-lg font-medium text-white/80">
          Please sign in to view your research sessions.
        </p>
      </div>
    );
  }

  const sessions = await db
    .select()
    .from(researchSessions)
    .where(eq(researchSessions.userId, userId))
    .orderBy(desc(researchSessions.createdAt));

  const sessionsWithPdfs = await Promise.all(
    sessions.map(async (session) => {
      const pdfs = await db
        .select()
        .from(researchPdfs)
        .where(eq(researchPdfs.sessionId, session.id));
      return { ...session, pdfs };
    }),
  );

  return (
    <div className="min-h-screen px-6 py-6 bg-gradient-to-br from-[#0d1a15] via-[#0f1f1a] to-[#132620]">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 text-transparent bg-clip-text flex items-center gap-3">
          <FlaskConical size={28} className="text-emerald-400" />
          Research Mode
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button className="bg-white/10 text-white border border-white/20 hover:bg-white/20 transition">
              Home
            </Button>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* New Session CTA */}
      <div className="mb-8">
        <Link href="/research/new">
          <Button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="h-4 w-4" />
            New Research Session
          </Button>
        </Link>
      </div>

      {/* Sessions List */}
      <div className="grid gap-5 max-w-4xl">
        {sessionsWithPdfs.length === 0 && (
          <div className="text-center py-16 text-white/40">
            <FlaskConical size={48} className="mx-auto mb-4 text-emerald-500/30" />
            <p className="text-lg">No research sessions yet.</p>
            <p className="text-sm mt-1">Upload 2–5 PDFs to start comparing research papers.</p>
          </div>
        )}

        {sessionsWithPdfs.map((session) => (
          <Link key={session.id} href={`/research/${session.id}`}>
            <div className="group cursor-pointer rounded-2xl p-5 bg-white/5 backdrop-blur-lg border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-300">
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white/90">
                      {session.title}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {session.pdfs.map((pdf) => (
                        <span
                          key={pdf.id}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          <FileText size={10} />
                          {pdf.pdfName.length > 25
                            ? pdf.pdfName.substring(0, 22) + "..."
                            : pdf.pdfName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-white/40 shrink-0 ml-4">
                  {new Date(session.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ResearchPage;

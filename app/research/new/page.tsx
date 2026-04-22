import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlaskConical, ArrowLeft } from "lucide-react";
import ResearchDropzone from "@/components/element/ResearchDropzone";

const NewResearchPage = async () => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-br from-[#0d1a15] via-[#0f1f1a] to-[#132620]">
      {/* Back */}
      <div className="absolute top-5 left-6">
        <Link href="/research">
          <Button className="flex items-center gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition">
            <ArrowLeft size={16} />
            Back to Sessions
          </Button>
        </Link>
      </div>

      {/* Icon + Title */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <FlaskConical size={40} className="text-emerald-400" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 text-transparent bg-clip-text">
          New Research Session
        </h1>
        <p className="mt-3 text-white/60 max-w-md">
          Upload up to <span className="text-emerald-300 font-semibold">5 research papers</span>.
          The AI will compare them and answer your questions with structured comparison tables.
        </p>
      </div>

      {/* Dropzone */}
      <ResearchDropzone />
    </div>
  );
};

export default NewResearchPage;

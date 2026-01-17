import ChatArea from "@/components/element/ChatArea";
import PDFViewer from "@/components/element/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

type Props = {
  params: { chat_id: string };
};

const ChatPage = async ({ params }: Props) => {
  const { chat_id } = params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  if (!_chats || _chats.length === 0) redirect("/");

  const currentChat = _chats.find((chat) => chat.id === parseInt(chat_id));
  if (!currentChat) redirect("/");

  return (
    <div
      className="w-full h-screen flex flex-col overflow-hidden
      bg-gradient-to-br from-[#1b1f2a] via-[#1f2333] to-[#262b40]"
    >
      {/* ================= Rich Neutral Navbar ================= */}
      <div className="relative">
        {/* Accent glow */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]
          bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400"
        />

        <div
          className="flex items-center justify-between px-6 py-4
          bg-[#202437]/90 backdrop-blur-xl
          border-b border-white/10 shadow-lg"
        >
          {/* Left */}
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="flex items-center gap-2 text-sm font-medium
                text-white/70 hover:text-white transition"
            >
              <ArrowLeft size={16} />
              Back
            </Link>

            <div className="h-5 w-px bg-white/20" />

            <h1
              className="text-lg font-extrabold tracking-tight
              bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300
              text-transparent bg-clip-text"
            >
              Intelidocs
            </h1>
          </div>

          {/* Right */}
          <Link href="/chat">
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl
              text-sm font-semibold text-white
              bg-gradient-to-r from-indigo-500 to-violet-600
              hover:from-violet-600 hover:to-indigo-600
              shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={16} />
              New Chat
            </div>
          </Link>
        </div>
      </div>

      {/* ================= Main Content ================= */}
      <div className="flex-1 grid grid-cols-1 grid-rows-2 md:flex overflow-hidden">
        {/* PDF Viewer */}
        <div
          className="md:flex-[3] p-4 overflow-y-auto
          bg-white/5 backdrop-blur-lg
          border-b md:border-b-0 md:border-r border-white/10"
        >
          <PDFViewer pdf_url={currentChat.pdfUrl || ""} />
        </div>

        {/* Chat Area */}
        <div
          className="md:flex-[2] overflow-y-auto
          bg-white/8 backdrop-blur-lg
          border-t md:border-t-0 md:border-l border-white/10"
        >
          <ChatArea chatId={parseInt(chat_id)} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

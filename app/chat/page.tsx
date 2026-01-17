import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

const dummyChats = [
  {
    id: "26",
    title: "Operating Systems Notes",
    lastMessage: "Explain deadlock with example",
    updatedAt: "2 hours ago",
  },
  {
    id: "2",
    title: "DBMS Important Questions",
    lastMessage: "Difference between SQL and NoSQL",
    updatedAt: "Yesterday",
  },
  {
    id: "3",
    title: "Blockchain Research Paper",
    lastMessage: "Summarize the consensus mechanism",
    updatedAt: "3 days ago",
  },
];

const ChatsPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1f2333]">
        <p className="text-lg font-medium text-white/80">
          Please sign in to view your chats.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-6 py-6
      bg-gradient-to-br from-[#1b1f2a] via-[#1f2333] to-[#262b40]"
    >
      {/* ================= Header ================= */}
      <div className="flex items-center justify-between mb-10">
        <h1
          className="text-3xl font-extrabold tracking-tight
          bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300
          text-transparent bg-clip-text"
        >
          Your Chats
        </h1>

        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              className="bg-white/10 text-white border border-white/20
              hover:bg-white/20 transition"
            >
              Home
            </Button>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* ================= New Chat CTA ================= */}
      <div className="mb-8">
        <Button
          className="flex items-center gap-2 px-5 py-3 rounded-xl
          bg-gradient-to-r from-indigo-500 to-violet-600
          hover:from-violet-600 hover:to-indigo-600
          text-white font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Start New Chat
        </Button>
      </div>

      {/* ================= Chats List ================= */}
      <div className="grid gap-5 max-w-4xl">
        {dummyChats.map((chat) => (
          <Link key={chat.id} href={`/chat/${chat.id}`}>
            <div
              className="group cursor-pointer rounded-2xl p-5
              bg-white/5 backdrop-blur-lg
              border border-white/10
              hover:bg-white/10 hover:border-white/20
              shadow-sm hover:shadow-md
              transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div
                    className="p-3 rounded-xl
                    bg-gradient-to-br from-indigo-500/20 to-violet-500/20
                    text-indigo-300"
                  >
                    <FileText />
                  </div>

                  <div>
                    <h3
                      className="font-semibold text-lg text-white/90
                      group-hover:text-white transition"
                    >
                      {chat.title}
                    </h3>
                    <p className="text-sm text-white/60 mt-1 line-clamp-1">
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-white/40">{chat.updatedAt}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChatsPage;

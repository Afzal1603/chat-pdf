import ChatArea from "@/components/element/ChatArea";
import ChatSideBar from "@/components/element/ChatSideBar";
import PDFViewer from "@/components/element/PDFViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: { chat_id: string };
};

const ChatPage = async (props: Props) => {
  const { chat_id } = await props.params;
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }
  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  if (!_chats) return redirect("/");
  if (!_chats.find((chat) => chat.id === parseInt(chat_id)))
    return redirect("/");
  const currentChat = _chats.find((chat) => chat.id === parseInt(chat_id));
  return (
    <div className=" grid grid-cols-1 grid-rows-3 sm:grid sm:grid-cols-2 sm:grid-rows-2 md:flex w-full h-screen overflow-y-auto">
      <div className="col-span-1 row-span-1 sm:col-span-1 sm:row-span-1 md:flex-[1] max-h-screen overflow-y-auto ">
        <ChatSideBar chats={_chats} chat_id={parseInt(chat_id)} />
      </div>

      <div className="col-span-1 row-span-1 sm:col-span-1 sm:row-span-1 md:flex-[3] :bg-red-500  max-h-screen p-4 overflow-y-auto border-b-2 border-zinc-900">
        <PDFViewer pdf_url={`${currentChat?.pdfUrl}` || ""} />
      </div>

      <div className="bg-gradient-to-br from-purple-200 to-indigo-300 col-span-1 row-span-1 sm:col-span-2 sm:row-span-1 md:flex-[2] max-h-screen overflow-y-auto scrollbar-custom border-t-4 md:border-t-0 md:border-l-4 border-zinc-900">
        <ChatArea chatId={parseInt(chat_id)} />
      </div>
    </div>
  );
};

export default ChatPage;

import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { PlusCircle } from "lucide-react";

type Props = {
  chats: DrizzleChat[];
  chat_id: number;
};

const ChatSideBar = ({ chats, chat_id }: Props) => {
  return (
    <div className="relative w-full h-full p-4 text-gray-200 bg-gradient-to-br from-purple-200  to-indigo-300 overflow-y-auto shadow-md">
      {/* New Chat Button */}
      <Link href="/">
        <Button className="w-full  border-dashed border-white border-2 text-indigo-300 font-semibold hover:bg-gradient-to-r from-pink-500 to-purple-500 hover:text-white transition-all hover:cursor-pointer">
          <PlusCircle className="mr-2 w-4 h-4" />
          New Chat
        </Button>
      </Link>

      {/* Chat List */}
      <div className="flex flex-col gap-2 mt-4">
        {chats.map((chat) => (
          <Link key={chat.id} href={`/chat/${chat.id}`}>
            <Button
              variant={chat.id === chat_id ? "default" : "secondary"}
              className={`w-full border ${
                chat.id === chat_id
                  ? "bg-gradient-to-r from-indigo-300 to-purple-300 text-pink-900"
                  : "text-indigo-800 border-indigo-400 hover:bg-indigo-100"
              } line-clamp-1 font-medium hover:cursor-pointer`}
            >
              {chat.pdfName}
            </Button>
          </Link>
        ))}
      </div>

      {/* Footer Links */}
      <div className="flex gap-4 absolute bottom-4 left-4">
        <Link
          href="/"
          className="text-sm text-indigo-800 font-semibold hover:underline"
        >
          Home
        </Link>
        <Link
          href="/"
          className="text-sm text-indigo-800 font-semibold hover:underline"
        >
          Source
        </Link>
      </div>
    </div>
  );
};

export default ChatSideBar;

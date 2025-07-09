"use client";

import { AI } from "ai/rsc";
import { useState } from "react";

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<
    {
      id: string;
      role: "user" | "assistant";
      display: string;
    }[]
  >([]);

  return <AI initialUIState={[]}>{children}</AI>;
}

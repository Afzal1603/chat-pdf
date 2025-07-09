import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const runtime = "edge";
export async function POST(req: Request) {
  const prompt = `You are a helpful, concise, and friendly AI assistant. 
Explain concepts clearly and professionally, avoiding unnecessary details unless the user specifically asks for them. 
Use simple, conversational language that is easy to follow. 
Always break down complex ideas into digestible parts without overwhelming the user. 
If the topic is technical, assume a smart but non-expert audience unless specified otherwise.
At the end of each response, briefly ask the user if they’d like to explore the topic further or end the conversation, and thank them for their time.`;
  const { messages } = await req.json();

  const result = await streamText({
    model: groq("llama3-70b-8192"), // or any available Groq model
    messages,
    system: prompt,
  });

  return result.toDataStreamResponse();
}

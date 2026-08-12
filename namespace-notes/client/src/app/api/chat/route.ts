import { streamText, convertToModelMessages, type UIMessage } from "ai";

import { openai } from "@ai-sdk/openai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages, namespaceId }: { messages: UIMessage[]; namespaceId: string } =
    await req.json();

  const contextMessages = messages.map((message) => ({
    role: message.role,
    content: message.parts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join(""),
  }));

  const response = await fetch(`${process.env.SERVER_URL}/api/context/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      namespaceId: namespaceId,
      messages: contextMessages,
    }),
  });

  const { context } = await response.json();

  if (context && context.prompt && context.prompt.length > 0) {
    const systemContent = context.prompt[0].content;

    const result = streamText({
      system: systemContent,
      temperature: 0.2,
      model: openai("gpt-4-turbo"),
      maxRetries: 8,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } else {
    throw new Error(
      "Unexpected server response structure: 'prompt' array is missing or empty."
    );
  }
}

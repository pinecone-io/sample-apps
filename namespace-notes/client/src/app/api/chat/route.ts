import { StreamingTextResponse, experimental_streamText } from "ai";

import { openai } from "@ai-sdk/openai";

export const runtime = "edge";

/**
 * Handles the POST request for the chat route.
 * @param req - The request object.
 * @returns A StreamingTextResponse object containing the result of the chat interaction.
 * @throws An error if the expected prompt structure is not present in the server response.
 */
export async function POST(req: Request) {
  const { messages, namespaceId } = await req.json();
  const response = await fetch(`${process.env.SERVER_URL}/api/context/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      namespaceId: namespaceId,
      messages: messages,
    }),
  });

  const { context } = await response.json();

  if (context && context.prompt && context.prompt.length > 0) {
    const systemContent = context.prompt[0].content;

    const result = await experimental_streamText({
      system: systemContent,
      temperature: 0.2,
      model: openai.chat("gpt-4-turbo"),
      maxRetries: 8,
      messages,
    });

    return new StreamingTextResponse(result.toAIStream());
  } else {
    throw new Error(
      "Unexpected server response structure: 'prompt' array is missing or empty."
    );
  }
}

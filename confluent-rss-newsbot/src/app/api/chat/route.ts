import { Metadata, getContext } from '@/services/context'
import type { PineconeRecord } from '@pinecone-database/pinecone'
import { Message, OpenAIStream, StreamingTextResponse, experimental_StreamData } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'


// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge'

export async function POST(req: Request) {
  try {

    const { messages, withContext, messageId } = await req.json()
    // Get the last message
    const lastMessage = messages[messages.length - 1]


    // Get the context from the last message
    const latestNewsTimeframe = process.env.LATEST_NEWS_TIMEFRAME ? parseInt(process.env.LATEST_NEWS_TIMEFRAME) : 86400
    const context = withContext ? await getContext(lastMessage.content, '', 30000, 0.01, false, latestNewsTimeframe) : ''

    const docs = (withContext && context.length > 0) ? (context as PineconeRecord[]).map(match => {
      const metadata = match.metadata as Metadata;
      const publishedAt = metadata.published_at ? new Date(metadata.published_at * 1000).toISOString() : 'Unknown date';
      return `[Published: ${publishedAt}]\n${metadata.chunk || ''}\nSource: ${metadata.link}`; // Include published date, chunk, and source URL
    }) : [];

    console.log("withContext", context.length)

    // Join all the chunks of text together, truncate to the maximum number of tokens, and return the result
    const contextText = docs.join("\n").substring(0, 30000)

    console.log("contextText", contextText)

    const prompt = [
      {
        role: 'system',
        content: `AI News Reader is a news reader that reads news articles and provides a summary of the news.
    When answering questions about current events or news:
    1. Start with something like "Here's what's happening in the world:". If the question is about a specific topic, start with something like "Here's what's happening in the world of [topic]:"
    2. Present each news item as a separate bullet point.
    3. Use bold text for the main topic of each news item.
    4. Provide a brief 1-2 sentence summary for each item.
    5. Add a newline between each bullet point for readability.
    6. End with a brief concluding sentence if appropriate.
    7. Be concise and to the point.
    8. Give answers for each news item in the context.
    9. Use the "published_at" metadata which is a unix timestamp to sort them in descending order.
      START CONTEXT BLOCK
      ${contextText}
      END OF CONTEXT BLOCK
    Use the provided context to answer questions accurately and concisely.
    If you don't have enough information, say "I'm sorry, but I don't have enough information to answer that question."
    Do not invent or assume any information not provided in the context.`,
      },
    ]

    const sanitizedMessages = messages.map((message: any) => {
      const { createdAt, id, ...rest } = message;
      return rest;
    });

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
      model: 'gpt-4o',
      stream: true,
      messages: [...prompt, ...sanitizedMessages.filter((message: Message) => message.role === 'user')]
    })

    const data = new experimental_StreamData();

    const stream = OpenAIStream(response, {
      onFinal(completion) {
        // IMPORTANT! you must close StreamData manually or the response will never finish.
        data.close();
      },
      // IMPORTANT! until this is stable, you must explicitly opt in to supporting streamData.
      experimental_streamData: true,
    });

    if (withContext) {
      data.append({
        context: [...context as PineconeRecord[]]
      })

    }

    // IMPORTANT! If you aren't using StreamingTextResponse, you MUST have the `X-Experimental-Stream-Data: 'true'` header
    // in your response so the client uses the correct parsing logic.
    return new StreamingTextResponse(stream, {}, data);


  } catch (e) {
    throw (e)
  }
}
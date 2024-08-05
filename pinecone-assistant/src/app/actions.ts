'use server'

import { createStreamableValue } from 'ai/rsc'
import { EventSource } from 'extended-eventsource';

type Message = {
  role: string;
  content: string;
}

export async function chat(messages: Message[]) {

  // Create an initial stream, which we'll populate with events from the Pinecone Assistants API
  const stream = createStreamableValue()

  // Construct the full URL to the Pinecone Assistant API for the specific assistant 
  // indicated by the user
  const url = `${process.env.PINECONE_ASSISTANT_URL}/${process.env.PINECONE_ASSISTANT_NAME}/chat/completions`

  const eventSource = new EventSource(url, {
    method: 'POST',
    body: JSON.stringify({
      stream: true,
      messages,
    }),
    headers: {
      Authorization: `Bearer ${process.env.PINECONE_API_KEY}`,
      'X-Project-Id': process.env.PINECONE_ASSISTANT_ID!,
    },
    disableRetry: true,
  });

  // When we recieve a new message from the Pinecone Assistant API, we update the stream
  // Unless the Assistant is done, in which case we close the stream
  eventSource.onmessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data)
    if (message?.choices[0]?.finish_reason) {
      eventSource.close();
      stream.done();
    } else {
      stream.update(event.data)
    }
  };

  eventSource.onerror = (error) => {
    console.error('EventSource error:', error);
    eventSource.close();
  };

  return { object: stream.value }
}
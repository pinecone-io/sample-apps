import type { PineconeRecord } from "@pinecone-database/pinecone";
import { getEmbeddings } from './embeddings';
import { getMatchesFromEmbeddings } from "./pinecone";

export type Metadata = {
  link: string,
  text: string,
  chunk: string,
  published_at: number,
}

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async (message: string, namespace: string, maxTokens = 3000, minScore = 0.01, getOnlyText = true, latestNewsTimeframe: number ): Promise<PineconeRecord[]> => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const minTimestamp = currentTimestamp - latestNewsTimeframe;
  console.log("Min timestamp:", minTimestamp);

  console.log("Getting embeddings for message:", message);
  const { values } = await getEmbeddings(message, minTimestamp);
  console.log("Embeddings received:", values.length);

  console.log("Getting matches from embeddings");
  const matches = await getMatchesFromEmbeddings(values, 10, namespace, minTimestamp);
  console.log("Matches received:", matches.length);

  if (matches.length === 0) {
    console.log("No matches found, check that the namespace and index are correct.");
    console.log("Namespace:", namespace);
    console.log("Index:", process.env.PINECONE_INDEX);
  }

  console.log("Matches and scores:");
  matches.forEach((match, index) => {
    console.log(`Match ${index + 1}: score = ${match.score}`);
  });

  const qualifyingDocs = matches.filter(m => m.score && m.score > minScore);
  console.log("Qualifying docs:", qualifyingDocs.length);

  console.log("Current timestamp:", currentTimestamp);
  console.log("Latest news timeframe:", latestNewsTimeframe);
  console.log("Min timestamp:", minTimestamp);

  return qualifyingDocs;
}

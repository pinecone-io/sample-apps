import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { VoyageEmbeddings } from '@langchain/community/embeddings/voyage';
import { PineconeStore } from '@langchain/pinecone';

export const maxDuration = 300;

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    // Initialize Pinecone client
    const pc = new Pinecone();

    // Initialize VoyageEmbeddings
    const voyageEmbeddings = new VoyageEmbeddings({
      apiKey: process.env.VOYAGE_API_KEY,
      inputType: 'document',
      modelName: "voyage-law-2",
    });

    // Initialize PineconeVectorStore
    const vectorStore = new PineconeStore(voyageEmbeddings, {
      pineconeIndex: pc.Index(process.env.PINECONE_INDEX as string),
    });

    console.log(`query is: ${query}`)

    const retrieved = await vectorStore.maxMarginalRelevanceSearch(query, { k: 20 });

    // Filter to ensure results set is unique - filter on the metadata.id
    const results: any = retrieved.filter((result, index) => {
      return (
        index ===
        retrieved.findIndex((otherResult: any) => {
          return result.metadata.id === otherResult.metadata.id;
        })
      );
    });

    return NextResponse.json({ results }, { status: 200 });

  } catch (error) {
    console.error('Error performing similarity search:', error);
    return NextResponse.json({ error: 'Failed to perform similarity search' }, { status: 500 });
  }
}


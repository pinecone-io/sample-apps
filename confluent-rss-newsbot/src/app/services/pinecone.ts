import { Pinecone, type ScoredPineconeRecord } from "@pinecone-database/pinecone";

export type Metadata = {
  url: string,
  text: string,
  chunk: string,
  hash: string
}

// The function `getMatchesFromEmbeddings` is used to retrieve matches for the given embeddings
const getMatchesFromEmbeddings = async (embeddings: number[], topK: number, namespace: string, minTimestamp: number): Promise<ScoredPineconeRecord<Metadata>[]> => {
  // Obtain a client for Pinecone
  const pinecone = new Pinecone();

  const indexName: string = process.env.PINECONE_INDEX || '';
  if (indexName === '') {
    throw new Error('PINECONE_INDEX environment variable not set')
  }
  console.log("Pinecone index name:", indexName);
  // Get the Pinecone index
  const index = pinecone!.Index<Metadata>(indexName);

  // Get the namespace
  const pineconeNamespace = index.namespace(process.env.PINECONE_NAMESPACE || namespace || '')

  try {
    // Query the index with the defined request
    const queryBody = {
      vector: embeddings,
      topK,
      includeMetadata: true,
      filter: {
        'published_at': { '$gte': minTimestamp }
      }
    }
    const queryResult = await pineconeNamespace.query(queryBody)
    console.log("query: ", JSON.stringify(queryBody))
    //console.log("queryResult", JSON.stringify(queryResult))
    return queryResult.matches || []
  } catch (e) {
    // Log the error and throw it
    console.log("Error querying embeddings: ", e)
    throw new Error(`Error querying embeddings: ${e}`)
  }
}

export { getMatchesFromEmbeddings };


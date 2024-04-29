import { ScoredPineconeRecord } from "@pinecone-database/pinecone";
import { Metadata, getMatchesFromEmbeddings } from "./pinecone";
import { embedChunks } from "./embeddings";

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async (
  message: string,
  namespace: string,
  maxCharacters = 5000,
  minScore = 0.15,
  getOnlyText = true
): Promise<string | ScoredPineconeRecord[]> => {
  try {
    // Wrap the message in an array before passing it to embedChunks
    const embeddings = await embedChunks([message]);
    
    // Extract the embedding from the response
    const embedding = embeddings[0].embedding;
    
    const matches = await getMatchesFromEmbeddings(embedding, 15, namespace);
    const qualifyingDocs = matches.filter((m) => m.score && m.score > minScore);

    if (!getOnlyText) {
      return qualifyingDocs;
    }

    // Deduplicate and get text
    const documentTexts = qualifyingDocs.map((match) => {
      const metadata = match.metadata as Metadata;
      return `REFERENCE URL: ${metadata.referenceURL} CONTENT: ${metadata.text}`;
    });

    // Concatenate, then truncate by maxCharacters
    const concatenatedDocs = documentTexts.join(" ");
    return concatenatedDocs.length > maxCharacters
      ? concatenatedDocs.substring(0, maxCharacters)
      : concatenatedDocs;
  } catch (error) {
    console.error("Failed to get context:", error);
    throw error;
  }
};
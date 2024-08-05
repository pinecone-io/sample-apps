export async function checkAssistantPrerequisites() {
  const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
  const PINECONE_ASSISTANT_NAME = process.env.PINECONE_ASSISTANT_NAME;

  console.log(`Checking prerequisites: API Key: ${PINECONE_API_KEY ? 'Set' : 'Not Set'}, Assistant Name: ${PINECONE_ASSISTANT_NAME}`);

  if (!PINECONE_API_KEY || !PINECONE_ASSISTANT_NAME) {
    console.error("Error: PINECONE_API_KEY or PINECONE_ASSISTANT_NAME is missing.");
    return { apiKey: null, assistantName: null };
  }

  return { apiKey: PINECONE_API_KEY, assistantName: PINECONE_ASSISTANT_NAME };
}
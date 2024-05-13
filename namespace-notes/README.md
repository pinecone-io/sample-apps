# Namespace Notes

### Multi-tenant Chat with your PDFs sample app

Unleash the power of conversational AI with your own documents

![image](https://github.com/pinecone-io/sample-apps/assets/24496327/df2c4281-893c-4ce5-ac36-101f4a076d6c)

[View Docs](https://docs.pinecone.io/examples/sample-apps/namespace-notes)

### Built With

- Pinecone Serverless
- Vercel AI SDK + OpenAI
- Next.js + tailwind
- Node version 20 or higher

---

## Running the Sample App

### Want to move fast?

Use `npx create-pinecone-app` to adopt this project quickly.

### Create a Pinecone Serverless index

Create a Pinecone index for this project.
The index should have the following properties:

- **dimension**: `1536`
  - You can change this as long as you change the default embedding model.
- **metric**: `cosine`
- **region**: `us-east-1`

**Grab an API key here**

<div id="pinecone-connect-widget"></div>

You can create the index [in the console](https://app.pinecone.io/organizations/-/projects/-/create-index/serverless),
or by following the instructions [here](https://docs.pinecone.io/guides/getting-started/quickstart#4-create-a-serverless-index).

### Start the project

**Requires Node version 20+**

To start the project, you will need two separate terminal instances, one for running the client and one for the server.

#### Client setup

From the project root directory, run the following command.

```bash
cd client && npm install
```

Make sure you have populated the client `.env` with relevant keys.

```bash
# You must first activate a Billing Account here: https://platform.openai.com/account/billing/overview
# Then get your OpenAI API Key here: https://platform.openai.com/account/api-keys
OPENAI_API_KEY="your-api-key-here"

# The URL of the server (only used for development)
SERVER_URL="http://localhost:4001"
```

Start the client.

```bash
npm run dev
```

#### Server setup

From the project root directory, run the following command.

```bash
cd server && npm install
```

Make sure you have populated the server `.env` with relevant keys.

```bash
PINECONE_API_KEY="your_pinecone_api_key_here"
PINECONE_INDEX_NAME="your_pinecone_index_name_here"
OPENAI_API_KEY="your_openai_api_key_here"

# Digital Ocean Spaces (OPTIONAL - for public file hosting)
DO_SPACES_ACCESS_KEY_ID="your_do_spaces_access_key_id_here"
DO_SPACES_SECRET_ACCESS_KEY="your_do_spaces_secret_access_key_here"
DO_SPACES_ENDPOINT="your_do_spaces_endpoint_here"
DO_SPACES_BUCKET_NAME="your_do_spaces_bucket_name_here"
```

Start the server.

```bash
npm run start
```

Note: You may notice that Digital Ocean Spaces is available as document storage. Using Digital Ocean Spaces is entirely optional. The project has a class defined to store document files locally on the server for quick project spin-up.

## Project structure

![image](https://github.com/pinecone-io/sample-apps/assets/24496327/5f13972f-386d-4a04-84f7-6e89cb95f124)

In this example we opted to use a simple client/server structure. We seperate the frontend from the backend in this manner in case you'd like to swap either out with a stack of your choice.

**Frontend Client**

The frontend uses Next.js, tailwind and components from Vercel's AI SDK to power the chatbot experience. It also leverages API routes to make calls to the server to fetch document references and context for both the UI and chatbot LLM.
The client uses local storage to store workspace information.

**Backend Server**

This project uses Node.js and Express to handle file uploads, validation checks, chunking, upsertion, context provision etc. Learn more about the implementation details below.

### Simple Multi-tenant RAG Methodology

This project uses a basic RAG architecture that achieves multitenancy through the use of namespaces. Files are uploaded to the server where they are chunked, embedded and upserted into Pinecone.

**Tenant Isolation**

We use namespaces as the mechanism to separate context between worksapces. When we add documents, we check for a namespaceId or generate a new id if the workspace is being created.

```typescript
/**
* Adds a new document.
* @param req - The request object.
* @param res - The response object.
* @returns A promise that resolves to the added document.
*/
async addDocuments(req: Request, res: Response) {
  // This is effectively the ID of the workspace / tenant
  let namespaceId = req.body.namespaceId;
  //...
```

**Chunking**

This project uses a basic paragraph chunking approach. We use `pdf-parse` to stream and parse pdf content and leverage a best effort paragraph chunking strategy with a defined `minChunkSize` and `maxChunkSize` to
account for documents with longer or shorter paragraph sizes. This helps us provide sizable content chunks for our Pinecone record metadata which will later be used by the LLM during retreival.

```typescript
/**
 * Splits a given text into chunks of 1 to many paragraphs.
 *
 * @param text - The input text to be chunked.
 * @param maxChunkSize - The maximum size (in characters) allowed for each chunk. Default is 1000.
 * @param minChunkSize - The minimum size (in characters) required for each chunk. Default is 100.
 * @returns An array of chunked text, where each chunk contains 1 or multiple "paragraphs"
 */
function chunkTextByMultiParagraphs(
  text: string,
  maxChunkSize = 1500,
  minChunkSize = 500
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;
    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      // Just using this to find the nearest paragraph boundary
      const paragraphBoundary = text.indexOf("\n\n", endIndex);
      if (paragraphBoundary !== -1) {
        endIndex = paragraphBoundary;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length >= minChunkSize) {
      chunks.push(chunk);
      currentChunk = "";
    } else {
      currentChunk += chunk + "\n\n";
    }

    startIndex = endIndex + 1;
  }

  if (currentChunk.length >= minChunkSize) {
    chunks.push(currentChunk.trim());
  } else if (chunks.length > 0) {
    chunks[chunks.length - 1] += "\n\n" + currentChunk.trim();
  } else {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
```

**Embedding**

Once we have our chunks we embed them in batches using [`text-embedding-3-small`](https://www.pinecone.io/models/text-embedding-3-small/)

```typescript
/**
 * Embed a piece of text using an embedding model or service.
 * This is a placeholder and needs to be implemented based on your embedding solution.
 *
 * @param text The text to embed.
 * @returns The embedded representation of the text.
 */
export async function embedChunks(chunks: string[]): Promise<any> {
  // You can use any embedding model or service here.
  // In this example, we use OpenAI's text-embedding-3-small model.
  const openai = new OpenAI({
    apiKey: config.openAiApiKey,
    organization: config.openAiOrganizationId,
  });
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
      encoding_format: "float",
      dimensions: 1536,
    });
    return response.data;
  } catch (error) {
    console.error("Error embedding text with OpenAI:", error);
    throw error;
  }
}
```

**RAG Document Management**

In order to store multiple documents within a particular namespace we need a convention that allows us to target the chunks belonging to a particular document.

We do this through id prefixing. We generate a document Id for each uploaded document, and then before uposertion we assign it as a prefix to the particular chunk id.
The below example uses the document id with an appended chunk id separated by a '`:`' symbol.

```typescript
// Combine the chunks and their corresponding embeddings
// Construct the id prefix using the documentId and the chunk index
 for (let i = 0; i < chunks.length; i++) {
   document.chunks.push({
     id: `${document.documentId}:${i}`,
     values: embeddings[i].embedding,
     text: chunks[i],
});
```

This comes in handy for targeted document updates and deletions.

**Upsertion**

Lastly, we upsert our embeddings to the Pinecone Namespace associated with the tenant in the form of a `PineconeRecord`.
This allows us to provide the reference text and url as metadata for use by our retreival system.

```typescript
    /**
   * Upserts a document into the specified Pinecone namespace.
   * @param document - The document to upsert.
   * @param namespaceId - The ID of the namespace.
   */
  async upsertDocument(document: Document, namespaceId: string) {
    // Adjust to use namespaces if you're organizing data that way
    const namespace = index.namespace(namespaceId);

    const vectors: PineconeRecord<RecordMetadata>[] = document.chunks.map(
      (chunk) => ({
        id: chunk.id,
        values: chunk.values,
        metadata: {
          text: chunk.text,
          referenceURL: document.documentUrl,
        },
      })
    );

    // Batch the upsert operation
    const batchSize = 200;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await namespace.upsert(batch);
    }
  }
```

**Context**

When a user asks a question via the frontend chat component, the Vercel AI SDK leverages the `/chat` endpoint for retrieval.
We then send the `top_k` most similar results back from Pinecone via our context route.

We populate a `CONTEXT BLOCK` that is wrapped with system prompt instructions for our chosen LLM to take advantage of in the response output.

It's important to note that different LLMs will have different context windows, so your choice of LLM will influence the `top_k` value you should return from Pinecone and along with the size of your chunks.
If the context block / prompt is longer than the context window of the LLM, it will not be fully included in generation results.

```typescript
import { getContext } from "./context";

export async function createPrompt(messages: any[], namespaceId: string) {
  try {
    // Get the last message
    const lastMessage = messages[messages.length - 1]["content"];

    // Get the context from the last message
    const context = await getContext(lastMessage, namespaceId);

    const prompt = [
      {
        role: "system",
        content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
          DO NOT SHARE REFERENCE URLS THAT ARE NOT INCLUDED IN THE CONTEXT BLOCK.
          AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
          If user asks about or refers to the current "workspace" AI will refer to the the content after START CONTEXT BLOCK and before END OF CONTEXT BLOCK as the CONTEXT BLOCK. 
          If AI sees a REFERENCE URL in the provided CONTEXT BLOCK, please use reference that URL in your response as a link reference right next to the relevant information in a numbered link format e.g. ([reference number](link))
          If link is a pdf and you are CERTAIN of the page number, please include the page number in the pdf href (e.g. .pdf#page=x ).
          If AI is asked to give quotes, please bias towards providing reference links to the original source of the quote.
          AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation. It will say it does not know if the CONTEXT BLOCK is empty.
          AI assistant will not invent anything that is not drawn directly from the context.
          AI assistant will not answer questions that are not related to the context.
          START CONTEXT BLOCK
          ${context}
          END OF CONTEXT BLOCK
      `,
      },
    ];
    return { prompt };
  } catch (e) {
    throw e;
  }
}
```

**Document Deletion**

To delete a document from a particular workspace, we need to perform a targeted deletion of the RAG document. Luckily, we can take advantage of the id prefixing strategy we employed earlier to perform a deletion of a specific document.
We use our `documentId:` to identify all the chunks associated with a particular document and then we perform deletions until we have successfully deleted all document chunks.

```typescript
// We retreive a paginated list of chunks from the namespace
const listResult = await namespace.listPaginated({
   prefix: `${documentId}:`,
   limit: limit,
   paginationToken: paginationToken,
 });

 ...

// Then we delete each of the chunks based on their ids
async deleteDocumentChunks(chunkIds: string[], namespaceId: string) {
  console.log("Deleting Document Chunks")
  const namespace = index.namespace(namespaceId);
  await namespace.deleteMany(chunkIds);
}
```

**Workspace Deletion** (Offboarding)

This is even simpler to achieve. If we have a the workspace / namespaceId at our disposal, we can simply call `deleteAll()` on the relevant namespace.

```typescript
 /**
   * Deletes a Pinecone namespace.
   *
   * @param namespaceId - The ID of the namespace to delete.
   * @returns A Promise that resolves when the namespace is deleted successfully.
   */
  async deletePineconeNamespace(namespaceId: string) {
    console.log("Deleting Workspace")
    const namespace = index.namespace(namespaceId);
    await namespace.deleteAll();
    console.log("Workspace deleted from Pinecone successfully")
  }
```

---

## Further Optimizations for the RAG pipeline

This is a relatively simple RAG pipeline - in practice there are improvements that could be made depending on a particular set of requirements.

**Using Rerankers**

For example, a reranker could be used in order to provide the most relevant set of retrieved results from Pinecone to the LLM.
A reranker could allow us to increase the `top_k` requested from Pinecone significantly and then constrain the output to a highly relevant set of records ordered by relevance all while abiding by the context length restrictions of the LLM.

Follow our [RAG series for more optimizations](https://www.pinecone.io/learn/series/rag/)

**Optimizing chunking strategy**

This project uses a paragraph chunker, which can provide good results for some use cases. Often, the quality of a chunk will play a significant role in the quality of the retrieval system as a whole.

Learn more about various [chunking strategies](https://www.pinecone.io/learn/chunking-strategies/)

**Enhancing metadata structure**

The metadata in this project consists simply of a reference url to the original content and the particular text snippet. You could extract richer metadata from the PDFs to provide improved context to the LLM.
This, of course, assumes a given PDF upload contains additional metadata and that it would be useful (page count, title, author(s), etc).

Read more about [vectorizing structured text](https://www.pinecone.io/learn/structured-data/).

## Troubleshooting

Experiencing any issues with the sample app?
[Submit an issue, create a PR](https://github.com/pinecone-io/sample-apps/), or post in our [community forum](https://community.pinecone.io)!

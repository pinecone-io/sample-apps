# Building a Real-Time News Intelligence Chatbot with Confluent, Pinecone, and Azure OpenAI

In this example, we'll build a full-stack application that uses Retrieval Augmented Generation (RAG) powered by [Pinecone](https://pinecone.io) and streaming data from [Confluent](https://www.confluent.io/) to deliver accurate and contextually relevant responses about current news events in a chatbot.

Our application will:

1. Poll a given news source (reddit news subs by default) to retrieve the latest news stories via RSS.
2. Stream these stories to Confluent for real-time processing.
3. Use OpenAI to generate embeddings for the news articles, which are then stored in Pinecone.
4. Provide a chat mechanism to query about the latest news and events in the world, using the stored embeddings to provide contextually relevant responses.

By the end of this tutorial, you'll have a real-time news intelligence chatbot that provides accurate responses about current events, ensuring a more effective and engaging user experience.

## Step 1: Setting Up Your Next.js Application

First, clone the repository and install the necessary packages:

```bash
git clone git@github.com:pinecone-field/confluent-demo.git
cd confluent-demo
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root and add the following:

```bash
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index_name
PINECONE_NAMESPACE=your_pinecone_namespace
OPENAI_API_KEY=your_azure_openai_api_key
CONFLUENT_BOOTSTRAP_SERVERS=your_confluent_bootstrap_servers
CONFLUENT_API_KEY=your_confluent_api_key
CONFLUENT_API_SECRET=your_confluent_api_secret
```

## Running the Application

1. The news poller

2. The news processor

3. The Next.js development server

You can create a custom script in your `package.json` to run all of these concurrently, or you can run them in separate terminal windows.

```javascript
{
  "scripts": {
    "dev": "next dev",
    "server": "python src/scripts/server.py",
    "start": "concurrently \"npm run server\" \"npm run dev\""
  }
}
```

Then you can start the entire application with:

```bash
npm run start
```

## Conclusion

You've now built a real-time news intelligence chatbot that uses Retrieval Augmented Generation (RAG) powered by Pinecone and OpenAI, using Confluent to stream news data. This application demonstrates how to integrate multiple technologies to create a powerful and contextually relevant chatbot.

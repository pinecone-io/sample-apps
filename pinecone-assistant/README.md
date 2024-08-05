# Pinecone Assistants Sample App

This sample app connects to an existing Pinecone Assistant to expose a public or private chat interface. Users can use the chat interace to ask your assistant questions, and it will use any documents you have uploaded to it to answer the questions. 

### Built With

- Pinecone Assistant
- Next.js + Python + Tailwind 
- Node version 20 or higher

---
## Running the Sample App

### Want to move fast?

Use `npx create-pinecone-app` to adopt this project quickly.
This will clone the project, and prompt you for necessary secrets. Make sure you've created your assistant and uploaded your files in the Pinecone console at this point.

### Create a Pinecone API key
**Grab an API key [here](https://app.pinecone.io)**

Before you start, this application requires you to build Pinecone Assistant in the Console first. You'll also need to upload files to this assistant. Any set of PDF files will do!

### Environment Variables

This app uses two optional environment variables to control certain features:

1. `SHOW_ASSISTANT_FILES`: Set to 'true' to display the files uploaded to your Pinecone Assistant. Default is 'false'.
2. `SHOW_CITATIONS`: Set to 'true' to display citations and references in the assistant's responses. Default is 'true'.

You can set these variables in your `.env.local` file:

```
SHOW_ASSISTANT_FILES=true
SHOW_CITATIONS=true
```

### Start the project

#### Dependency Installation

```bash
cd pinecone-assistant && npm install 
```
Then, start the development server: 

```bash
npm run dev
```

Visit http://localhost:3000 to access the chat interface.

## Project structure

![Pinecone Assistant Sample App Architecture](./public/pinecone-assistant-architecture.png)

---
## Troubleshooting

Experiencing any issues with the sample app?
Submit an issue, create a PR, or post in our community forum!

---
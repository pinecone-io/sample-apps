'use server'

import { NextResponse } from 'next/server';
import { Pinecone } from "@pinecone-database/pinecone";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

import {
  createIndexIfNecessary,
  pineconeIndexHasVectors
} from './pinecone';

import { type Document } from '../types/document'
import { promises as fs } from 'fs';

const readMetadata = async (): Promise<Document['metadata'][]> => {
  const data = await fs.readFile(path.resolve(process.cwd(), 'docs/db.json'), 'utf8')
  return JSON.parse(data).documents;
};

// Prepare metadata for upsert to Pinecone - Langchain's PDF loader adds some 
// fields that we want to remove before upserting to Pinecone, because Pinecone
// requires that metadata is a string, number or array (not an object)
const flattenMetadata = (metadata: any): Document['metadata'] => {
  const flatMetadata = { ...metadata };
  if (flatMetadata.pdf) {
    if (flatMetadata.pdf.pageCount) {
      flatMetadata.totalPages = flatMetadata.pdf.pageCount;
    }
    delete flatMetadata.pdf;
  }
  if (flatMetadata.loc) {
    delete flatMetadata.loc
  }
  return flatMetadata;
};

// Function to batch upserts
const batchUpserts = async (index: any, vectors: any[], batchSize: number = 50) => {
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    console.log(`Upserting batch ${i + 1} of ${batch.length} vectors...`);
    await index.upsert(batch);
  }
};

export const initiateBootstrapping = async (targetIndex: string) => {

  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT}`;

  // Initiate a POST request with fetch to the /ingest endpoint, in order to begin 
  // chunking, embedding and upserting documents that will form the knowledge base
  const response = await fetch(`${baseUrl}/api/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ targetIndex }),
  });
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
}

export const handleBootstrapping = async (targetIndex: string) => {

  try {
    console.log(`Running bootstrapping procedure against Pinecone index: ${targetIndex}`);

    // If a Pinecone index with the target name doesn't exist, create it
    // If it does exist, return while suppressing conflict errors
    await createIndexIfNecessary(targetIndex);

    // Short-circuit early if the index already exists and has vectors in it 
    const hasVectors = await pineconeIndexHasVectors(targetIndex);
    if (hasVectors) {
      console.log('Pinecone index already exists and has vectors in it - returning early without bootstrapping');
      return NextResponse.json({ sucess: true }, { status: 200 });
    }

    if (!hasVectors) {
      console.log('Pinecone index does not exist or has no vectors in it - bootstrapping');
    }

    // Load metadata from db.json
    const metadata = await readMetadata();

    const docsPath = path.resolve(process.cwd(), 'docs/')

    // Load all PDFs within the specified directory
    const loader = new DirectoryLoader(docsPath, {
      '.pdf': (filePath: string) => new PDFLoader(filePath),
    });

    const documents = await loader.load();

    // Merge extracted metadata with documents based on filename
    documents.forEach((doc, index) => {
      const fileMetadata = metadata.find(meta => meta.filename === path.basename(doc.metadata.source));
      if (fileMetadata) {
        doc.metadata = { ...doc.metadata, ...fileMetadata, pageContent: doc.pageContent };
      } else {
        console.warn(`No metadata found for ${doc.metadata.source}`);
      }
    });

    // Split text into chunks
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    const splits = await splitter.splitDocuments(documents);

    // Assign unique IDs to each split and flatten metadata
    const castedSplits: Document[] = splits.map(split => ({
      pageContent: split.pageContent,
      metadata: {
        ...flattenMetadata(split.metadata as Document['metadata']),
        id: uuidv4(),
        pageContent: split.pageContent, // Ensure pageContent is included in metadata
      },
    }));

    // Extract page contents
    const pageContents = castedSplits.map(split => split.pageContent);

    // Generate embeddings for each chunk
    const voyageEmbeddings = new VoyageEmbeddings({
      apiKey: process.env.VOYAGE_API_KEY,
      inputType: "document",
      modelName: "voyage-law-2",
    });

    const embeddings = await voyageEmbeddings.embedDocuments(pageContents);

    // Combine embeddings with metadata and ensure IDs are defined
    const vectors = castedSplits.map((split, index) => {
      if (!split.metadata.id) {
        throw new Error('Document chunk is missing an ID');
      }
      return {
        id: split.metadata.id!,
        values: embeddings[index],
        metadata: split.metadata,
      };
    });

    const pc = new Pinecone();
    const index = pc.Index(process.env.PINECONE_INDEX as string);

    // Batch upserts to stay within the 2MB request size limit
    await batchUpserts(index, vectors);

    console.log('Bootstrap procedure completed.');
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error during bootstrap procedure:', error);
  }

  return true;
}

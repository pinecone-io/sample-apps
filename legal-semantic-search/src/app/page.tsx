'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import SearchForm from '@/components/SearchForm';
import DocumentView from '@/components/DocumentView';
import { type Document } from './types/document';
import { sanitizeString } from '@/lib/utils';

interface SearchResult {
  metadata: Document['metadata'];
  content: string;
}

const runBootstrapProcedure = async () => {
  const response = await fetch('/api/bootstrap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.json();
    console.log(body);
    throw new Error(`API request failed with status ${response.status}`);
  }
};

const checkAndBootstrapIndex = async (
  setIsBootstrapping: (isBootstrapping: boolean) => void,
  setIsIndexReady: (isIndexReady: boolean) => void
) => {
  setIsBootstrapping(true);
  await runBootstrapProcedure();
  setIsBootstrapping(false);
  setIsIndexReady(true);
};

const handleSearch = async (
  query: string,
  setResults: (results: SearchResult[]) => void,
  setIsSearching: (isSearching: boolean) => void
) => {
  setIsSearching(true);
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const body = await response.json();
    console.log(body);
    throw new Error(`API request failed with status ${response.status}`);
  }

  const { results } = await response.json();
  setResults(results);
  setIsSearching(false);
};

const suggestedSearches = [
  'Cases about personal freedoms being violated',
  'Cases involving a US President',
  'Cases involving guns',
  'Cases where Nixon was the defendant',
  'How much power does the commerce clause give Congress?',
  'Cases about personal rights or congressional overreach?',
  'Cases involving the ability to pay for an attorney',
  'Cases about the right to remain silent',
  'Landmark cases that shaped freedom of speech laws',
  'Cases where defendant was found with a gun',
  'What cases involved personal rights or congressional overreach?',
  'Cases where the judge expressed grave concern'
];

export default function Home() {
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isIndexReady, setIsIndexReady] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SearchResult | null>(null);

  useEffect(() => {
    checkAndBootstrapIndex(setIsBootstrapping, setIsIndexReady);
  }, []);

  const clearResults = () => {
    setQuery('');
    setResults([]);
  };

  if (selectedDocument) {
    return (
      <DocumentView
        document={selectedDocument}
        quote={selectedDocument.metadata.pageContent}
        onBack={() => setSelectedDocument(null)}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <div className="flex flex-col items-center w-full mb-6">
        {isBootstrapping && (
          <div className="flex items-center justify-center mb-4">
            <p className="text-center text-gray-500 mr-2">Chunking, embedding, and upserting legal documents...</p>
            <div className="spinner border-4 border-t-transparent border-gray-200 rounded-full w-6 h-6 animate-spin"></div>
          </div>
        )}
      </div>
      {isIndexReady && !isBootstrapping && (
        <div className="w-full mx-auto p-4">
          <h1 className="text-3xl text-center font-bold mb-4 text-indigo-900">What are you looking for?</h1>
          <p className="text-center mb-4">Use natural language to search through legal documents.</p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <SearchForm
              suggestedSearches={suggestedSearches}
              onSearch={(query: string) => {
                handleSearch(query, setResults, setIsSearching);
                setQuery(query);
              }}
            />
          </div>
          {isSearching && (
            <div className="flex items-center justify-center mb-4">
              <p className="text-center text-gray-500 mr-2">Searching...</p>
              <div className="spinner border-4 border-t-transparent border-gray-200 rounded-full w-6 h-6 animate-spin"></div>
            </div>
          )}
          {(results.length > 0) && query && (
            <div className="flex mb-8 p-4">
              <p>{results.length} result{results.length > 1 ? 's' : ''} for <span className="text-indigo-900 font-bold">{query}</span>.</p>
              <button
                type="button"
                onClick={clearResults}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <circle cx="12" cy="12" r="10" stroke="gray" fill="none" />
                  <line x1="15" y1="9" x2="9" y2="15" stroke="gray" />
                  <line x1="9" y1="9" x2="15" y2="15" stroke="gray" />
                </svg>
              </button>
            </div>
          )}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <Card
                key={index}
                className="w-full max-w-lg bg-white shadow-lg rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-2xl cursor-pointer"
                onClick={() => setSelectedDocument(result)}
              >
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-2 text-indigo-900">{result.metadata.title}</h2>
                  <blockquote className="relative font-medium italic leading-relaxed text-gray-700 bg-gray-100 p-4 rounded-lg break-words w-full max-h-36 overflow-hidden" title={result.metadata.pageContent}>
                    <div className="absolute top-0 left-0 text-6xl font-bold text-gray-300">&ldquo;</div>
                    <p className="line-clamp-6">{sanitizeString(result.metadata.pageContent)}</p>
                    <div className="absolute bottom-0 right-0 text-6xl font-bold text-gray-300">&rdquo;</div>
                  </blockquote>
                  <div className="mt-4 text-sm">
                    <span className="font-bold text-indigo-900">Topic:</span> <span className="truncate">{result.metadata.topic}</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-bold text-indigo-900">Verdict:</span> <span className="truncate">{result.metadata.outcome}</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-bold text-indigo-900">Year:</span> {new Date(result.metadata.date).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

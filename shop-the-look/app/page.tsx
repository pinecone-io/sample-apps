"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import videojs from 'video.js';
import type VideoJsPlayer from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import Layout from './layout';
import './styles.css';
import { SVGProps } from 'react';
import { track } from '@vercel/analytics';
import Head from 'next/head';

// Handles Python backend API URL based on the environment
const API_URL = (() => {
  switch (process.env.NEXT_PUBLIC_VERCEL_ENV) {
    case "development":
      return process.env.NEXT_PUBLIC_DEVELOPMENT_URL || 'http://localhost:8000';
    case "preview":
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL || ''}`;
    case "production":
      return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || ''}`;
    case "demo":
      return "https://shop-the-look.sample-app.pinecone.io";
    default:
      return "http://localhost:8000";
  }
})();

interface Result {
  score: number;
  metadata: {
    gcs_file_name: string;
    gcs_public_url: string;
    gcs_file_path: string;
    file_type: 'image' | 'video' | 'text';
    start_offset_sec: number;
    end_offset_sec: number;
    interval_sec: number;
    segment: number;
  };
}

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Result[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [totalVectors, setTotalVectors] = useState<number | null>(null);
  const [isSearchComplete, setIsSearchComplete] = useState<boolean>(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [searchType, setSearchType] = useState<'text' | 'image' | 'video' | null>(null);
  const [isInputEmpty, setIsInputEmpty] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const suggestions = [
    "Summer beach outfit",
    "Business casual for women",
    "Streetwear look",
    "Autumn jewelry aesthetic",
    "Minimalist wardrobe essential",
    "Athleisure outfit ideas",
    "Formal evening wear",
    "Vintage inspired look",
    "Thrift store gems",
    "Casual kpop"
  ];
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setIsInputEmpty(false);
    setShowSuggestions(false);
  };

  const clearResults = () => {
    setQuery('');
    setResults([]);
    setIsInputEmpty(true);
    setIsSearchComplete(false);
    setSearchTime(null);
    setSearchType(null);
    setErrorMessage(null);
  };

  const playersRef = useRef<{ [key: string]: VideoJsPlayer }>({});

  const VerticalDivider = () => (
    <div className="h-6 w-px bg-gray-200"></div>
  );

  useEffect(() => {
    let scrollTracked = false;
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercentage > 50 && !scrollTracked) {
        track('scroll_depth', { depth: '50%' });
        scrollTracked = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const pageViewData = {
      timestamp: new Date().toISOString(),
      screenSize: `${window.screen.width}x${window.screen.height}`,
      deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browserName: navigator.userAgent,
      referrer: document.referrer,
      loadTime: performance.now(),
      language: navigator.language,
      totalVectors: totalVectors,
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    };

    track('page_viewed', pageViewData);
  }, [totalVectors]); // Include totalVectors in the dependency array if it's not available immediately

  useEffect(() => {

    const fetchTotalVectors = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/index/info`);
        setTotalVectors(response.data.total_vectors);
      } catch (error) {
        console.error('Error fetching total vectors:', error);
      }
    };

    fetchTotalVectors();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(playersRef.current).forEach(player => {
        if (player && typeof player.dispose === 'function') {
          player.dispose();
        }
      });
      playersRef.current = {};
    };
  }, []);

  useEffect(() => {
    results.forEach((result, index) => {
      if (result.metadata.file_type === 'video') {
        const videoId = getVideoId(result, index);
        const videoElement = document.getElementById(videoId) as HTMLVideoElement;

        if (videoElement && !playersRef.current[videoId]) {
          const player = videojs(videoElement, {
            aspectRatio: '1:1',
            fluid: true,
            controls: true,
            muted: true,
            preload: 'auto'
          });

          player.one('ready', () => {
            player.currentTime(result.metadata.start_offset_sec);
          });

          playersRef.current[videoId] = player;
        }
      }
    });

    return () => {
      Object.keys(playersRef.current).forEach(videoId => {
        if (!results.some((result, index) => getVideoId(result, index) === videoId)) {
          playersRef.current[videoId].dispose();
          delete playersRef.current[videoId];
        }
      });
    };
  }, [results]);

  const resetSearchState = () => {
    setResults([]);
    setIsSearchComplete(false);
    setSearchTime(null);
    setSearchType(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isInputEmpty) return;

    setShowSuggestions(false);

    // Reset search state before starting a new search
    resetSearchState();

    setIsSearching(true);
    setIsSearchComplete(false);
    setSearchTime(null);
    setSearchType('text');
    setErrorMessage(null);
    setIsLoadingResults(true);
    const startTime = Date.now();
    try {
      const response = await axios.post(`${API_URL}/api/search/text`, { query });
      setResults(response.data.results);
      const endTime = Date.now();
      setSearchTime(endTime - startTime);
      setIsSearchComplete(true);
      track('search_results', {
        searchType,
        query,
        searchTime
      });
    } catch (error) {
      console.error('Error during text search:', error);
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(`Oops! ${error.response.data.detail || 'An unexpected error occurred'}`);
      } else {
        setErrorMessage('Oops! An unexpected error occurred. Our engineers have been notified.');
      }
    } finally {
      setIsSearching(false);
      setIsLoadingResults(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsInputEmpty(value.trim() === '');
    setShowSuggestions(value.trim() !== '');
  };

  const MAX_FILE_SIZE = 4500000; // 4.5 MB Vercel upload limit

  // Vercel's Serverless Functions does not allow file uploads larger than 4.5 MB
  // This function compresses the image to a smaller size if it exceeds the limit
  const cropImageToCenter = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const size = 512;
          canvas.width = size;
          canvas.height = size;

          if (ctx) {
            let sx, sy, sWidth, sHeight;
            if (img.width > img.height) {
              sHeight = img.height;
              sWidth = sHeight;
              sx = (img.width - sWidth) / 2;
              sy = 0;
            } else {
              sWidth = img.width;
              sHeight = sWidth;
              sx = 0;
              sy = (img.height - sHeight) / 2;
            }

            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to crop image'));
              }
            }, file.type);
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    resetSearchState();

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const endpoint = isImage ? `${API_URL}/api/search/image` : `${API_URL}/api/search/video`;
    setSearchType(isImage ? 'image' : 'video');

    if (!isImage && !isVideo) {
      setErrorMessage('Oops, you uploaded an unsupported file type. Please upload an image or video.');
      return;
    }

    if (isImage) {
      const allowedFormats = ['bmp', 'gif', 'jpeg', 'png', 'jpg'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !allowedFormats.includes(fileExtension)) {
        setErrorMessage(`We don't support this image format: ${fileExtension || 'unknown'}. Please upload an image in one of the following formats: ${allowedFormats.join(', ')}.`);
        return;
      }
    }

    // Vercel's Serverless Functions does not allow file uploads larger than 4.5 MB
    if (isVideo && file.size > 4500000) {
      setErrorMessage(`We're sorry, the video file is too large. Maximum allowed size is 4.5 MB due to hosting limitations. Your file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
      return;
    }

    setIsUploading(true);
    setIsSearchComplete(false);
    setSearchTime(null);
    setErrorMessage(null);
    setIsLoadingResults(true);
    const startTime = Date.now();

    try {
      let fileToUpload: File | Blob = file;

      if (isImage && file.size > MAX_FILE_SIZE) {
        const compressedBlob = await cropImageToCenter(file);
        fileToUpload = new File([compressedBlob], file.name, { type: file.type });
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      const endTime = Date.now();
      setResults(response.data.results);
      setSearchTime(endTime - startTime);
      track('file_uploaded', {
        fileType: isImage ? 'image' : 'video',
        fileName: file.name,
        originalSize: file.size,
        compressedSize: fileToUpload.size
      });
      setIsSearchComplete(true);
      setQuery('');
      setIsInputEmpty(true);
    } catch (error) {

      track('search_error', {
        searchType,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Error during file upload:', error);

      if (axios.isAxiosError(error)) {
        track('search_error', {
          searchType,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });

        if (error.response?.status === 413) {
          if (file.size > MAX_FILE_SIZE) {
            setErrorMessage(`We're very sorry, but we can't upload files larger than 4.5 MB due to hosting limitations. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Please try a smaller file or compress this one.`);
            return;
          }
        } else if (error.response) {
          setErrorMessage(`Oops! ${error.message}`);
        } else {
          setErrorMessage('Oops! An unexpected error occurred. Our engineers have been notified.');
        }
      } else {
        console.error('Unknown error:', error);
        setErrorMessage('Oops! An unexpected error occurred. Our engineers have been notified.');
      }
    } finally {
      setIsSearching(false);
      setIsUploading(false);
      setIsLoadingResults(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      track('file_selected');
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      track('file_dropped');
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const getScoreLabel = (score: number) => {
    if (score <= 10) return { label: 'Low', color: 'bg-red-500', score };
    if (score <= 50) return { label: 'Medium', color: 'bg-blue-500', score };
    return { label: 'High', color: 'bg-green-500', score };
  };

  const getVideoId = (result: Result, index: number) => `video-${index}-${result.metadata.gcs_public_url}`;

  return (
    <Layout>
      <Head>
        <title>Shop The Look</title>
      </Head>
      <div
        className={`flex flex-col items-center justify-start min-h-screen bg-gray-100 ${dragging ? 'border-4 border-dashed border-blue-500' : ''
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ fontFamily: "'Inter', 'Helvetica', 'Arial', sans-serif" }}
      >
        <div className="max-w-6xl w-full px-4 md:px-0 mt-12">
          <h1 className="font-sans text-4xl mb-3 text-center text-indigo-800">Shop The Look</h1>
          <h1 className="font-sans text-base mb-5 text-center text-gray-900">Upload a photo or video (under 4.5 MB) or search by text for outfit inspiration</h1>
          <div className="max-w-xl mx-auto relative">
            <form onSubmit={handleSubmit} className="flex items-center">
              <div className="flex-grow flex items-center bg-white rounded shadow-md">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Describe the outfit, or drag in an image or video"
                    className="w-full flex-grow px-6 py-3 text-gray-700 bg-transparent focus:outline-none"
                    disabled={isUploading || isSearching}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto z-10" style={{ width: 'calc(100% + 59px)', marginLeft: '-1px' }}>
                      <div className="mt-3"></div>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-6 py-1.5 hover:bg-gray-100 cursor-pointer text-gray-700  flex items-center"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <MagnifyingGlassIcon className="h-4 w-4 mr-3 text-indigo-500" />
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                  </div>  
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="upload-input"
                    disabled={isUploading || isSearching}
                  />
                  {!isInputEmpty && (
                    <>
                      <button
                        type="button"
                        onClick={clearResults}
                        className="text-gray-400 hover:text-gray-500 mr-0.5 focus:outline-none"
                        disabled={isUploading || isSearching}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="44"
                          height="44"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                      </button>
                      <VerticalDivider />
                    </>
                  )}
                <label htmlFor="upload-input" className={`cursor-pointer px-4 ${isUploading || isSearching ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700'} focus:outline-none`}>
                  <PhotoFrameIcon className="h-6 w-6" />
                </label>
              </div>
              <button
                type="submit"
                className={`ml-1 px-3 ${isInputEmpty
                    ? 'text-gray-400 cursor-not-allowed'
                    : isUploading || isSearching
                      ? 'text-gray-400 cursor-wait'
                      : 'text-gray-500 hover:text-gray-700'
                  } focus:outline-none`}
                disabled={isInputEmpty || isUploading || isSearching}
              >
                <MagnifyingGlassIcon className="h-6 w-6 text-indigo-500 hover:text-indigo-700" />
              </button>
            </form>


            {errorMessage && (
              <div className="w-full mt-4 text-red-500 text-center">
                {errorMessage}
              </div>
            )}
            {(isUploading || isSearching) && (
              <div className="w-full mt-8 flex items-center justify-center">
                <span className="text-gray-500 pulse">
                  {isUploading ? "Uploading, embedding, and searching..." : "Searching..."}
                </span>
                <div className="ml-3 spinner border-4 border-t-transparent border-indigo-300 rounded-full w-6 h-6 animate-spin"></div>
              </div>
            )}
          </div>
          <div>
            {isSearchComplete && searchTime !== null && totalVectors !== null && (
              <div className="ml-1 mt-6 mb-2 flex items-center text-left text-gray-700">
                <p>
                  Searched {totalVectors.toLocaleString()} styles
                  {searchType === 'text' && <> for <strong className="text-indigo-800">{query}</strong></>}
                  {searchType === 'image' && <> for <strong className="text-indigo-800">your image</strong></>}
                  {searchType === 'video' && <> for <strong className="text-indigo-800">your video</strong></>}
                </p>
                <button
                  type="button"
                  onClick={clearResults}
                  className="text-gray-400 hover:text-gray-500 mb-0.4 ml-2 focus:outline-none"
                  disabled={isUploading || isSearching}
                >

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </button>
              </div>
            )}
            {isLoadingResults && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(20)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-300 h-64 w-full rounded-sm"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mt-2"></div>
                  </div>
                ))}
              </div>
            )}
            {!isLoadingResults && results.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result, index) => {
                  const { label, color, score } = getScoreLabel(result.score);
                  const videoId = getVideoId(result, index);
                  return (
                    <div key={videoId}>
                      {result.metadata.file_type === 'image' ? (
                        <img src={result.metadata.gcs_public_url} alt="Result" className="w-full h-auto object-cover mt-2 rounded hover-shadow" />
                      ) : (
                        <div className="video-container mt-2 rounded hover-shadow">
                          <video
                            id={videoId}
                            className="video-js vjs-default"
                          >
                            <source src={result.metadata.gcs_public_url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      <div className={`inline-block mt-2 mb-2 px-1 py-1 text-sm text-gray-400`}>
                        {label} relevance: {score}%
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="w-full mt-auto py-4 text-center text-gray-500 text-sm">
          <p>
            Built with{' '}
            <a href="https://www.pinecone.io/?utm_source=shop-the-look&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="text-indigo-800 hover:underline">
              Pinecone
            </a>
            ,{' '}
            <a href="https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-multimodal-embeddings" target="_blank" rel="noopener noreferrer" className="text-indigo-800 hover:underline">
              Google Multimodal Embedding Model
            </a>
            , and{' '}
            <a href="https://www.pexels.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-800 hover:underline">
              Pexels
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}

function PhotoFrameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function MagnifyingGlassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
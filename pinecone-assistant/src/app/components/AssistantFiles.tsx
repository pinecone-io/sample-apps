'use client'

import { useState } from 'react';
import { File, Reference } from '../types';

interface AssistantFilesProps {
  files: File[];
  referencedFiles: Reference[];
}

export default function AssistantFiles({ files, referencedFiles }: AssistantFilesProps) {
  const [isOpen, setIsOpen] = useState(true);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const isReferenced = (file: File) => {
    return referencedFiles.some(ref => {
      return file.name.toLowerCase().includes(ref.name.toLowerCase()) ||
             ref.name.toLowerCase().includes(file.name.toLowerCase());
    });
  };

  return (
    <div className="w-full mt-4 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <button
        className="w-full flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-800 dark:text-gray-200">Assistant Files</span>
        <span className="text-xl text-gray-600 dark:text-gray-300">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="p-4">
          <div className="flex flex-wrap -mx-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="w-full sm:w-1/2 md:w-1/3 px-2 mb-4 relative"
              >
                <div className={`bg-gray-100 dark:bg-gray-700 p-4 rounded-lg ${isReferenced(file) ? 'border-2 border-blue-500 dark:border-blue-400' : ''}`}>
                  <h3 className="font-semibold truncate text-gray-800 dark:text-gray-200">{file.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Size: {formatFileSize(file.size)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Created: {new Date(file.created_at).toLocaleDateString()}
                  </p>
                  {isReferenced(file) && (
                    <span className="absolute top-2 right-2 bg-blue-500 dark:bg-blue-400 text-white text-xs px-2 py-1 rounded">Referenced</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

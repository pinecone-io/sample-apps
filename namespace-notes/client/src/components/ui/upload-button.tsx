'use client';

import { uploadFiles } from '@/app/api/files/file-upload-util';
import React, { useState, useRef } from 'react';
import { FaUpload, FaSpinner } from 'react-icons/fa';

/**
 * UploadButton component for uploading files to a workspace.
 *
 * @param workspaceId - The ID of the workspace.
 * @param uploadCompletionCallback - Callback function to be called after the upload is completed.
 * @param locked - Indicates whether the upload button is locked or not.
 */
export default function UploadButton({
  workspaceId,
  uploadCompletionCallback,
  locked = false,
}: {
  workspaceId: string;
  uploadCompletionCallback: () => void;
  locked: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(
        (file) => file.type === 'text/plain' || file.type === 'application/pdf'
      );
      if (validFiles.length > 0) {
        handleUpload(validFiles);
      } else {
        alert('Please select text or PDF files only.');
      }
    }
  };

  const handleUpload = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file.');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('namespaceId', workspaceId);
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }

    try {
      const data = await uploadFiles(formData);
      console.log('Files uploaded successfully:', data);
      // Reset the input field after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    }

    setIsUploading(false);
    uploadCompletionCallback();
  };

  const handleButtonClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="">
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
        ref={fileInputRef}
        disabled={locked}
      />
      <div
        className={`flex items-center justify-center h-10 w-10 p-3 text-white ${
          isUploading || locked ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1C17FF] cursor-pointer hover:bg-blue-600'
        } rounded-full focus:outline-none`}
        onClick={handleButtonClick}
      >
        {isUploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
      </div>
    </div>
  );
}
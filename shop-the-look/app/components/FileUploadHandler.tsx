import axios from 'axios';
import { cropImageToCenter } from './ImageCropper';
import { track } from '@vercel/analytics';

const MAX_FILE_SIZE = 4500000; // 4.5 MB Vercel upload limit

interface FileUploadHandlerProps {
  API_URL: string;
  setSearchType: (type: 'image' | 'video') => void;
  setErrorMessage: (message: string | null) => void;
  setIsUploading: (isUploading: boolean) => void;
  setIsSearchComplete: (isComplete: boolean) => void;
  setSearchTime: (time: number | null) => void;
  setIsLoadingResults: (isLoading: boolean) => void;
  setResults: (results: any[]) => void;
  setQuery: (query: string) => void;
  setIsInputEmpty: (isEmpty: boolean) => void;
  setIsSearching: (isSearching: boolean) => void;
}

export const handleFileUpload = async (
  file: File,
  {
    API_URL,
    setSearchType,
    setErrorMessage,
    setIsUploading,
    setIsSearchComplete,
    setSearchTime,
    setIsLoadingResults,
    setResults,
    setQuery,
    setIsInputEmpty,
    setIsSearching
  }: FileUploadHandlerProps
) => {
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

  if (isVideo && file.size > MAX_FILE_SIZE) {
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
    handleUploadError(error, file.size, setErrorMessage);
  } finally {
    setIsSearching(false);
    setIsUploading(false);
    setIsLoadingResults(false);
  }
};

const handleUploadError = (error: any, fileSize: number, setErrorMessage: (message: string) => void) => {
  track('search_error', {
    searchType: error.searchType,
    errorMessage: error instanceof Error ? error.message : 'Unknown error'
  });
  console.error('Error during file upload:', error);

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 413) {
      if (fileSize > MAX_FILE_SIZE) {
        setErrorMessage(`We're very sorry, but we can't upload files larger than 4.5 MB due to hosting limitations. Your file is ${(fileSize / (1024 * 1024)).toFixed(1)} MB. Please try a smaller file or compress this one.`);
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
};
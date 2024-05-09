"use client";

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceChatContext, Workspace } from "@/lib/hooks/workspace-chat-context";
import Spinner from "@/components/ui/spinner";
import { uploadFiles } from "@/app/api/files/file-upload-util";

const validFileTypes = ["application/pdf"];

export default function NewPage() {
  const { addWorkspace } = useWorkspaceChatContext();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter((file) => validFileTypes.includes(file.type));
      setSelectedFiles(validFiles.length > 0 ? files : null);
      if (validFiles.length === 0) {
        alert("Please select text or PDF files only.");
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFiles) {
      alert("Please select at least one file.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("newWorkspace", "true");
    Array.from(selectedFiles).forEach((file) => formData.append("files", file));

    try {
      const data = await uploadFiles(formData);
      console.log("Files uploaded successfully:", data);

      const newWorkspace: Workspace = {
        id: data.namespaceId,
        name: title,
        createdAt: Date.now(),
        fileUrls: [],
      };
      addWorkspace(newWorkspace);

      router.push(`/workspace/${data.namespaceId}`);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert(`Failed to upload files. Please try again. ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full rounded-2xl bg-gradient-to-br from-slate-50 to-white">
      <div className="w-full max-w-xl rounded-md p-6">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full font-light px-0 py-3 mb-4 text-opacity-75 text-6xl bg-transparent border-gray-200 
            rounded-md focus:outline-none focus:ring-2 focus:ring-transparent focus:border-transparent text-black"
            placeholder="Topic"
          />
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-300">
            <span className="text-lg text-gray-400">
              {selectedFiles ? `${selectedFiles.length} file(s) selected` : "Add .pdf file(s)..."}
            </span>
            <label
              htmlFor="fileInput"
              className="px-4 py-2 text-[#1C17FF] border-[#1C17FF] border rounded-md 
              hover:bg-[#1b17ff1e] focus:outline-none cursor-pointer"
            >
              Browse
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              disabled={isLoading}
              onChange={handleFileChange}
              style={{ display: "none" }}
              multiple
            />
          </div>
          <div className="mt-4 text-sm font-medium text-[#1C17FF] py-2 mb-5 rounded-lg">
            <p>
              This is a public demo, do not upload private information.
              <br />
            </p>
          </div>
          <button
            type="submit"
            className="w-full py-3 text-lg font-medium text-white bg-[#1C17FF] rounded-md 
            hover:bg-blue-600 focus:outline-none flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner />
            ) : (
              "Create New Workspace"
            )}
          </button>
          {isLoading && (
            <div className="mt-4 text-sm font-medium text-gray-500">
              Upserting and indexing documents... this may take a few minutes....
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
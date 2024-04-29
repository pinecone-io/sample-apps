import React, { useState } from 'react';
import { IconCross } from './icons';

const FileCard = ({ fileUrl, handleDeleteFile, readOnly = false }: { fileUrl: string, handleDeleteFile: () => Promise<void>, readOnly?: boolean }) => {

    const [deletionInProgress, setDeletionInProgress] = useState(false);

    return (
        <div className="group relative h-full">
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 px-5 border h-full border-gray-300 rounded shadow-sm ${deletionInProgress ? "animate-pulse bg-red-200" : "bg-white/90 "} backdrop-blur-3xl 
                truncate transition duration-200 ease-in-out hover:bg-slate-50 text-black`}
            >
                {fileUrl.split('/').pop()}
            </a>
            {!readOnly && <button
                className="absolute z-50 -top-5 -right-3 text-white bg-red-500 hover:bg-red-700 rounded-full p-1 
                opacity-0 group-hover:opacity-100 transition-opacity duration-100 ease-in-out scale-75"
                onClick={() => {
                    if (deletionInProgress) return;
                    setDeletionInProgress(true);
                    handleDeleteFile()
                        .finally(() => setDeletionInProgress(false));

                }}
            >
                <IconCross />
            </button>}
        </div>
    );
};

export default FileCard;






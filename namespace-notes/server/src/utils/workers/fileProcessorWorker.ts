import { parentPort, workerData } from "worker_threads";
import { chunkAndEmbedFile, processFile } from "../documentProcessor";

async function processFileWorker() {
  const { fileData, fileType, fileName, documentId, documentUrl } = workerData;
  try {
    const { documentContent } = await processFile(
      fileName,
      fileData,
      fileType
    );
    const { document } = await chunkAndEmbedFile(
      documentId,
      documentUrl,
      documentContent
    );
    parentPort?.postMessage({ document });
  } catch (error: any) {
    parentPort?.postMessage({ error: error.message });
  }
}

processFileWorker();

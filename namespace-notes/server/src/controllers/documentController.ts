// documentController.ts

/**
 * Controller class for managing documents.
 */
import fs from "fs";
import { Request, Response } from "express";
import { Worker } from "worker_threads";
import multer from "multer";
import path from "path";
import { Document, DocumentModel } from "../models/documentModel";
import { v4 as uuidv4 } from "uuid";
import { storageService } from "../utils/storage/storage";
import { ServerStorage } from "../utils/storage/serverStorage";
import { SpacesStorage } from "../utils/storage/spacesStorage";
import { upload } from "../utils/multer";

class DocumentsController {
  private documentModel: DocumentModel;

  /**
   * Constructs a new instance of DocumentsController.
   */
  constructor() {
    this.documentModel = new DocumentModel();
    this.addDocuments = this.addDocuments.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
    this.serveDocument = this.serveDocument.bind(this);
    this.deleteWorkspace = this.deleteWorkspace.bind(this);
  }

  /**
   * Safe upsert with retry logic to handle rate limits.
   * @param document - The document data to be upserted.
   * @param namespaceId - The namespace ID of the document.
   */
  async safeUpsertDocument(document: Document, namespaceId: string) {
    let retries = 0;
    const maxRetries = 5;
    while (retries < maxRetries) {
      try {
        await this.documentModel.upsertDocument(document, namespaceId);
        break;
      } catch (error: any) {
        if (
          error.message.includes("rate limit exceeded") &&
          retries < maxRetries
        ) {
          // Exponential backoff
          const waitTime = Math.pow(2, retries) * 1000;
          console.log(`Waiting ${waitTime / 1000} seconds before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          retries++;
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Adds a new document.
   * @param req - The request object.
   * @param res - The response object.
   * @returns A promise that resolves to the added document.
   */
  async addDocuments(req: Request, res: Response) {
    upload(req, res, async (err) => {
      // This is effectively the ID of the workspace / tenant
      let namespaceId = req.body.namespaceId;
      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        return res.status(400).json({ message: err.message });
      } else if (err) {
        console.error("Error uploading files:", err);
        return res.status(400).json({ message: "File upload error" });
      }

      const isNewWorkspace = req.body.newWorkspace === "true";
      if (isNewWorkspace) {
        namespaceId = uuidv4();
      } else if (!namespaceId) {
        return res
          .status(400)
          .json({ message: "Missing required field: namespaceId" });
      }

      const filesObject = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      if (!filesObject || !filesObject.files) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const files = filesObject.files;
      const documentResponses: any = [];
      const errors: string[] = [];

      const workerPromises = files.map((file) => {
        return new Promise<Document>((resolve, reject) => {
          const documentId = uuidv4();
          const fileKey = `${namespaceId}/${documentId}/${file.originalname}`;
          const documentUrl = storageService.constructFileUrl(fileKey);

          const fileData = fs.readFileSync(file.path);

          // Save the file to storage
          storageService
            .saveFile(file, fileKey)
            .then(() => {
              const workerPath = path.join(
                __dirname,
                "../utils/workers/fileProcessorWorker"
              );
              const worker = new Worker(workerPath, {
                workerData: {
                  fileData,
                  fileType: file.mimetype,
                  fileName: file.originalname,
                  documentId,
                  documentUrl,
                },
              });

              worker.on("message", (result: any) => {
                if (result.error) {
                  reject(new Error(result.error));
                } else {
                  resolve(result.document);
                }
              });

              worker.on("error", (error: Error) => {
                reject(error);
              });
            })
            .catch((error) => {
              reject(error);
            });
        });
      });

      try {
        const documents = await Promise.all(workerPromises);
        await Promise.all(
          documents.map((document) =>
            this.safeUpsertDocument(document, namespaceId)
          )
        );

        documentResponses.push(...documents);
      } catch (error: any) {
        console.error("Error processing documents:", error);
        errors.push(error.message);
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: "Some documents failed to process",
          errors,
          documentResponses,
        });
      }
      res.status(200).json({
        message: "Documents added successfully",
        namespaceId,
        documentResponses,
      });
    });
  }

  /**
   * Retrieves a list of files in a namespace.
   *
   * @param req - The request object.
   * @param res - The response object.
   */
  async listFilesInNamespace(req: Request, res: Response) {
    const namespaceId = req.params.namespaceId;

    try {
      let files;

      files = await storageService.listFilesInNamespace(namespaceId);
      console.log("Files from storage:", files);

      res.json(files);
    } catch (error) {
      console.error("Error listing files in namespace:", error);
      res.status(500).json({ message: "Failed to list files" });
    }
  }

  /**
   * Deletes a document from database.
   * @param req - The request object.
   * @param res - The response object.
   * @returns A promise that resolves to the deleted document.
   */
  async deleteDocument(req: Request, res: Response) {
    const documentId = req.params.documentId;
    const namespaceId = req.params.namespaceId;

    try {
      // Delete the document chunks from Pinecone
      const pageSize = 100;
      let paginationToken;
      let deleteCount = 0;

      do {
        try {
          const listResult = await this.documentModel.listDocumentChunks(
            documentId,
            namespaceId,
            pageSize,
            paginationToken
          );

          if (listResult.chunks.length === 0) {
            break;
          }

          const chunkIds = listResult.chunks.map((chunk) => chunk.id);
          console.log(`Deleting chunks prefixed with ${documentId}`);
          await this.documentModel.deleteDocumentChunks(chunkIds, namespaceId);
          deleteCount += chunkIds.length;

          if (!listResult.paginationToken) {
            break;
          }
          paginationToken = listResult.paginationToken;
        } catch (error: any) {
          if (error.message.includes("No IDs provided for delete request")) {
            console.warn(
              "Skipping Pinecone deletion due to missing IDs:",
              error
            );
            break;
          } else {
            console.error("Error deleting document chunks:", error);
            res.status(400).send({ message: "Error deleting document chunks" });
            throw error;
          }
        }
      } while (paginationToken !== undefined);

      console.log(`Deleted ${deleteCount} chunks for document ${documentId}`);
    } catch (error) {
      console.error("Error deleting document chunks from Pinecone:", error);
      // Continue with file deletion even if Pinecone deletion fails
    }

    try {
      // Delete the document file from storage
      var result = await storageService.deleteFileFromWorkspace(
        namespaceId,
        documentId
      );

      res.status(200).send({ message: result });
    } catch (error) {
      console.error("Error deleting document file:", error);
      res.status(500).send({ message: "Failed to delete document file" });
    }
  }

  /**
   * Deletes a workspace and all associated files.
   * @param req - The request object.
   * @param res - The response object.
   */
  async deleteWorkspace(req: Request, res: Response) {
    const namespaceId = req.params.namespaceId;

    try {
      // Delete the namespace from Pinecone
      await this.documentModel.deletePineconeNamespace(namespaceId);

      try {
        // Delete the relevant folder from storage
        await storageService.deleteWorkspaceFiles(namespaceId);
      } catch (error) {
        console.error("Failed to delete namespace from Spaces:", error);
        // Log the error and continue with the response
      }

      res.status(200).send({ message: "Workspace deleted successfully" });
    } catch (error) {
      console.error("Error deleting workspace:", error);
      res.status(500).send({ message: "Failed to delete workspace" });
    }
  }

  /**
   * Serves a document file based on the fileKey.
   *
   * @param req - The request object.
   * @param res - The response object.
   */
  async serveDocument(req: Request, res: Response) {
    const { namespaceId, documentId } = req.params;
    const fileKey = `${namespaceId}/${documentId}`;
    console.log("Serving file:", fileKey);

    try {
      const fileUrl = storageService.constructFileUrl(fileKey);

      if (storageService instanceof ServerStorage) {
        // Serve the file from the local filesystem
        const filePath = path.join("uploads", fileKey);
        const files = fs.readdirSync(filePath);
        const firstFile = files[0];
        const fileFullPath = path.join(filePath, firstFile);
        res.sendFile(fileFullPath, { root: "." });
      } else if (storageService instanceof SpacesStorage) {
        // Redirect to the file URL in DigitalOcean Spaces
        res.redirect(fileUrl);
      } else {
        throw new Error("Unsupported storage service");
      }
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  }
}

export default new DocumentsController();

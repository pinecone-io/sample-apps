// serverStorage.ts
import fs from "fs";
import path from "path";
import { FileDetail, StorageService } from "./storage";
import { safeJoin, sanitizeSegment } from "./pathSafety";

export class ServerStorage implements StorageService {
  private readonly uploadDir = "uploads";

  async saveFile(file: Express.Multer.File, fileKey: string): Promise<void> {
    const [namespaceId, documentId, ...rest] = fileKey.split("/");
    // Confine the file to <uploadDir>/<namespaceId>/<documentId>/<fileName>.
    // Any traversal in the user-supplied segments is rejected by safeJoin.
    const fileName = path.basename(rest.join("/"));
    const destinationPath = safeJoin(
      this.uploadDir,
      namespaceId,
      documentId,
      fileName
    );
    const documentDirectory = path.dirname(destinationPath);

    if (!fs.existsSync(documentDirectory)) {
      fs.mkdirSync(documentDirectory, { recursive: true });
    }

    await fs.promises.rename(file.path, destinationPath);
  }

  constructFileUrl(fileKey: string): string {
    const domain =
      process.env.SERVER_URL || `http://localhost:${process.env.PORT || 4001}`;
    return `${domain}/api/documents/files/${fileKey}`;
  }

  async getFilePath(fileKey: string): Promise<string> {
    const segments = fileKey.split("/").filter((s) => s.length > 0);
    const filePath = safeJoin(this.uploadDir, ...segments);
    const files = await fs.promises.readdir(filePath);
    const firstFile = sanitizeSegment(files[0], "file name");
    return path.join(filePath, firstFile);
  }

  async deleteWorkspaceFiles(namespaceId: string): Promise<void> {
    const namespaceDirectory = safeJoin(this.uploadDir, namespaceId);
    if (fs.existsSync(namespaceDirectory)) {
      fs.rmdirSync(namespaceDirectory, { recursive: true });
    }
  }

  async deleteFileFromWorkspace(
    namespaceId: string,
    documentId: string
  ): Promise<void> {
    try {
      const documentDirectory = safeJoin(
        this.uploadDir,
        namespaceId,
        documentId
      );
      if (fs.existsSync(documentDirectory)) {
        fs.rmdirSync(documentDirectory, { recursive: true });
      }
    } catch (error) {
      console.error("Failed to delete file from server storage:", error);
      throw error;
    }
  }

  async listFilesInNamespace(namespaceId: string): Promise<FileDetail[]> {
    const namespacePath = safeJoin(this.uploadDir, namespaceId);
    try {
      const documentDirs = fs
        .readdirSync(namespacePath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      const allFiles: FileDetail[] = [];
      for (const documentId of documentDirs) {
        const documentPath = safeJoin(this.uploadDir, namespaceId, documentId);
        const files = fs.readdirSync(documentPath);
        allFiles.push(
          ...files.map((filename) => ({
            documentId: documentId,
            name: filename,
            url: this.constructFileUrl(
              `${namespaceId}/${documentId}/${filename}`
            ),
          }))
        );
      }
      return allFiles;
    } catch (error) {
      console.error(
        "Failed to list files in namespace from server storage:",
        error
      );
      throw error;
    }
  }
}

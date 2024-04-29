// spacesStorage.ts

import fs from "fs";
import { Upload } from "@aws-sdk/lib-storage";
import { S3, ObjectCannedACL } from "@aws-sdk/client-s3";
import { FileDetail, StorageService } from "./storage";

const spacesEndpoint = `https://nyc3.digitaloceanspaces.com`;

const s3 = new S3({
  endpoint: spacesEndpoint,
  region: "nyc3",
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY || "",
  },
});

export class SpacesStorage implements StorageService {
  async saveFile(file: Express.Multer.File, fileKey: string): Promise<void> {
    const fileStream = fs.createReadStream(file.path, { autoClose: true });

    const params = {
      Bucket: process.env.DO_SPACES_BUCKET_NAME,
      Key: fileKey,
      Body: fileStream,
      ACL: ObjectCannedACL.public_read,
      ContentType: file.mimetype,
      ContentDisposition: "inline",
    };

    try {
      await new Upload({
        client: s3,
        params: {
          ...params,
          ACL: ObjectCannedACL.public_read,
        },
      }).done();
    } catch (error) {
      console.error("Failed to upload file to Spaces:", error);
      throw error;
    } finally {
      try {
        await fs.promises.unlink(file.path);
      } catch (error) {
        console.error("Failed to delete local file:", error);
      }
    }
  }

  async deleteFileFromWorkspace(
    namespaceId: string,
    documentId: string
  ): Promise<void> {
    const filePrefix = `${namespaceId}/${documentId}/`;
    const listParams = {
      Bucket: process.env.DO_SPACES_BUCKET_NAME!,
      Prefix: filePrefix,
    };
    const listedObjects = await s3.listObjectsV2(listParams);
    if (listedObjects.Contents) {
      const objectsToDelete = listedObjects.Contents.map(
        (content) => content.Key
      )
        .filter((key): key is string => key !== undefined)
        .map((key) => ({ Key: key }));

      if (objectsToDelete.length > 0) {
        const deleteParams = {
          Bucket: process.env.DO_SPACES_BUCKET_NAME!,
          Delete: { Objects: objectsToDelete },
        };
        await s3.deleteObjects(deleteParams, { requestTimeout: 60000 });
      }
    }
  }

  async getFilePath(fileKey: string): Promise<string> {
    throw new Error("Not necessary for Spaces storage");
  }

  constructFileUrl(fileKey: string): string {
    return `https://${process.env.DO_SPACES_BUCKET_NAME}.nyc3.digitaloceanspaces.com/${fileKey}`;
  }

  async deleteWorkspaceFiles(namespaceId: string): Promise<void> {
    const filePrefix = `${namespaceId}/`;
    const listParams = {
      Bucket: process.env.DO_SPACES_BUCKET_NAME!,
      Prefix: filePrefix,
    };
    const listedObjects = await s3.listObjectsV2(listParams);
    if (listedObjects.Contents) {
      const objectsToDelete = listedObjects.Contents.map(
        (content) => content.Key
      )
        .filter((key): key is string => key !== undefined)
        .map((key) => ({ Key: key }));

      if (objectsToDelete.length > 0) {
        const deleteParams = {
          Bucket: process.env.DO_SPACES_BUCKET_NAME!,
          Delete: { Objects: objectsToDelete },
        };

        const maxRetries = 3;
        let retries = 0;
        while (retries < maxRetries) {
          try {
            await s3.deleteObjects(deleteParams, { requestTimeout: 60000 });
            return; // Deletion successful, exit the method
          } catch (error) {
            console.error(
              `Failed to delete objects (attempt ${retries + 1}):`,
              error
            );
            retries++;
          }
        }

        throw new Error(
          `Failed to delete objects after ${maxRetries} attempts`
        );
      }
    }
  }

  async listFilesInNamespace(namespaceId: string): Promise<FileDetail[]> {
    const bucket = process.env.DO_SPACES_BUCKET_NAME!;
    const prefix = `${namespaceId}/`;
    return this.listFilesRecursive(prefix, bucket);
  }

  private async listFilesRecursive(
    currentPrefix: string,
    bucket: string
  ): Promise<FileDetail[]> {
    const params = {
      Bucket: bucket,
      Prefix: currentPrefix,
      Delimiter: "/",
    };

    try {
      const data = await s3.listObjectsV2(params);
      let files = (data.Contents ?? []).map((item: { Key?: string }) => ({
        documentId: item.Key ? item.Key.split("/")[1] : "",
        name: item.Key ? item.Key.replace(currentPrefix, "") : "",
        url: item.Key ? this.constructFileUrl(item.Key) : "",
      }));

      // If there are subdirectories, recursively list their files
      if (data.CommonPrefixes && data.CommonPrefixes.length > 0) {
        const recursiveFiles = await Promise.all(
          data.CommonPrefixes.map((cp) =>
            this.listFilesRecursive(cp.Prefix!, bucket)
          )
        );
        // Flatten the array of arrays
        files = files.concat(recursiveFiles.flat());
      }

      return files;
    } catch (error) {
      console.error("Failed to list files from Spaces:", error);
      throw error;
    }
  }
}

export interface FilesResponse {
  files: FetchedFile[];
}
export interface FetchedFile {
  name: string;
  url: string;
  documentId: string;
}

export const maxDuration = 600

/**
 * Fetches all file URLs for a given namespace from the backend server.
 *
 * @param req - The request object.
 * @param res - The response object.
 */
export async function GET(request: Request) {
  const namespaceId = new URL(request.url).searchParams.get("namespaceId");

  console.log("GET request to fetch files for namespace:", namespaceId);

  if (typeof namespaceId !== "string") {
    throw new Error("Invalid or missing namespace ID in request URL");
  }

  try {
    // Ensure the SERVER_URL is correctly configured in your environment
    const url = `${process.env.SERVER_URL}/api/documents/files/${namespaceId}`;
    const response = await fetch(url, { method: "GET" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${data.message}`);
    }

    // Assuming the response is a JSON array of file URLs
    const fileUrls: FilesResponse = data;
    console.log("Files fetched successfully: ", JSON.stringify(fileUrls));
    return new Response(JSON.stringify(fileUrls), { status: 200 });
  } catch (error) {
    console.error("Error fetching files:", error);
    throw new Error(`Failed to fetch files URLs: ${error}`);
  }
}

/**
 * Sends a POST request to upload files to the server.
 *
 * @param req - The request object containing the form data.
 * @returns A Promise that resolves to a Response object.
 */
export async function POST(req: Request) {
  const formData = new FormData();
  const data = await req.formData();
  const entries = Array.from(data.entries());

  for (const [key, value] of entries) {
    if (key === "newWorkspace") {
      formData.append(key, JSON.stringify(true));
    } else {
      formData.append(key, value);
    }
  }

  try {
    const response = await fetch(
      `${process.env.SERVER_URL}/api/documents/add`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (response.ok) {
      const responseData = await response.json();
      console.log("Files uploaded successfully:", responseData);
      return new Response(
        JSON.stringify({ namespaceId: responseData.namespaceId }),
        { status: 200 }
      );
    } else {
      throw new Error("Failed to upload files, " + response.statusText);
    }
  } catch (error) {
    console.error("Error uploading files:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

/**
 * Deletes a file or a workspace based on the provided parameters.
 *
 * @param request - The incoming request object from the frontend.
 */
export async function DELETE(request: Request) {
  const documentId = new URL(request.url).searchParams.get("documentId");
  const namespaceId = new URL(request.url).searchParams.get("namespaceId");

  if (typeof namespaceId !== "string") {
    throw new Error("Invalid or missing namespace ID in request URL");
  }

  try {
    let url;
    let message;

    if (typeof documentId === "string") {
      // Delete a specific document
      url = `${process.env.SERVER_URL}/api/documents/files/delete/${namespaceId}/${documentId}`;
      message = "File deleted successfully";
    } else {
      // Delete the entire workspace/namespace
      url = `${process.env.SERVER_URL}/api/documents/workspace/${namespaceId}`;
      message = "Workspace deleted successfully";
    }

    const response = await fetch(url, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Failed to delete ${documentId ? "file" : "workspace"}: ${data.message}`
      );
    }

    console.log(message);
    return new Response(JSON.stringify({ message }), { status: 200 });
  } catch (error) {
    console.error(
      `Error deleting ${documentId ? "file" : "workspace"}:`,
      error
    );
    throw new Error(
      `Failed to delete ${documentId ? "file" : "workspace"}: ${error}`
    );
  }
}

export async function uploadFiles(data: FormData) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/documents/add`,
      {
        method: "POST",
        body: data,
      }
    );

    if (response.ok) {
      const responseData = await response.json();
      console.log("Files uploaded successfully:", responseData);
      return { namespaceId: responseData.namespaceId };
    } else {
      throw new Error("Failed to upload files, " + response.statusText);
    }
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
}


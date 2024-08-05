import { NextResponse } from 'next/server';
import { checkAssistantPrerequisites } from '../../utils/assistantUtils';

export async function GET() {
  const { apiKey, assistantName } = await checkAssistantPrerequisites();
  
  if (!apiKey || !assistantName) {
    return NextResponse.json({
      status: "error",
      message: "PINECONE_API_KEY and PINECONE_ASSISTANT_NAME are required.",
      files: []
    }, { status: 400 });
  }

  try {
    const response = await fetch(`https://prod-1-data.ke.pinecone.io/assistant/files/${assistantName}`, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Unexpected response format: files is not an array');
    }

    const fileData = data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      created_at: file.created_on,
      updated_at: file.updated_on,
      status: file.status,
      metadata: file.metadata
    }));

    return NextResponse.json({
      status: "success",
      message: `Files for assistant '${assistantName}' retrieved successfully.`,
      files: fileData
    }, { status: 200 });

  } catch (error) {
    console.error(`Error listing assistant files: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      status: "error",
      message: `Failed to list assistant files: ${error instanceof Error ? error.message : String(error)}`,
      files: []
    }, { status: 500 });
  }
}
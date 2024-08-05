import { NextResponse } from 'next/server';
import { checkAssistantPrerequisites } from '../../utils/assistantUtils';

export async function GET() {
  const { apiKey, assistantName } = await checkAssistantPrerequisites();
  
  if (!apiKey || !assistantName) {
    return NextResponse.json({
      status: "error",
      message: "PINECONE_API_KEY and PINECONE_ASSISTANT_NAME are required.",
      exists: false
    }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.pinecone.io/assistant/assistants', {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // List the assistants and check if the aassistant targeted by process.env.PINECONE_ASSISTANT_NAME exists
    const assistants = await response.json();
    const assistantExists = assistants.assistants.some((assistant: any) => assistant.name === assistantName);

    return NextResponse.json({
      status: "success",
      message: `Assistant '${assistantName}' check completed.`,
      exists: assistantExists,
      assistant_name: assistantName
    }, { status: 200 });

  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({
      status: "error",
      message: `Failed to check assistant: ${error instanceof Error ? error.message : String(error)}`,
      exists: false
    }, { status: 500 });
  }
}
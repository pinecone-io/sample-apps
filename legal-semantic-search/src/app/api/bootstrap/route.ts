import { NextResponse } from 'next/server';
import { initiateBootstrapping } from '../../services/bootstrap';

export const maxDuration = 300;

// This route uses a "fire and forget" pattern in order to: 
// 1. Return a response to the client quickly 
// 2. Allow a long-running background task to complete
export async function POST() {
  await initiateBootstrapping(process.env.PINECONE_INDEX as string)

  return NextResponse.json({ success: true }, { status: 200 })
}

import { NextRequest, NextResponse } from 'next/server';

import { handleBootstrapping } from '../../services/bootstrap'

export const maxDuration = 300;

// This route uses a "fire and forget" pattern in order to: 
// 1. Return a response to the client quickly 
// 2. Allow a long-running background task to complete
export async function POST(req: NextRequest) {

  const { targetIndex } = await req.json();

  await handleBootstrapping(targetIndex);

  return NextResponse.json({ success: true }, { status: 200 })
}

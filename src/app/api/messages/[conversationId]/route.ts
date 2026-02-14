import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  // Stub: no message history until Phase 1 (DB + webhooks).
  // Keep a stable JSON shape to avoid UI crashes.
  return NextResponse.json({
    mode: 'send-only' as const,
    conversationId,
    data: [],
    paging: null
  });
}


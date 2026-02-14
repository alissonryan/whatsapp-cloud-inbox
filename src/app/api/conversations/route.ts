import { NextResponse } from 'next/server';

export async function GET() {
  // WhatsApp Cloud API is webhook-first. Until Phase 1 (DB + webhooks),
  // we run the UI in "send-only" mode without conversation history.
  return NextResponse.json({
    mode: 'send-only' as const,
    data: [],
    paging: null
  });
}


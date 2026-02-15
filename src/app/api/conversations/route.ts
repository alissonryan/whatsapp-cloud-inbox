import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultTenant } from '@/lib/tenant';

export async function GET(request: Request) {
  // Backwards-compatible fallback: without DB, we keep the UI in send-only mode.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      mode: 'send-only' as const,
      data: [],
      paging: null
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50;

    const tenant = await getOrCreateDefaultTenant();

    const conversations = await prisma.conversation.findMany({
      where: { tenantId: tenant.id },
      include: { contact: true, phoneNumber: true },
      orderBy: { lastActiveAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      mode: 'db' as const,
      data: conversations.map((c) => ({
        id: c.id,
        phoneNumber: c.contact.waId,
        status: c.status,
        lastActiveAt: c.lastActiveAt.toISOString(),
        phoneNumberId: c.phoneNumber.phoneNumberId,
        metadata: {},
        contactName: c.contact.name ?? undefined,
        messagesCount: c.messagesCount,
        lastMessage: c.lastMessageText
          ? {
              content: c.lastMessageText,
              direction: c.lastMessageDirection ?? 'inbound',
              type: c.lastMessageType ?? undefined
            }
          : undefined
      })),
      paging: null
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

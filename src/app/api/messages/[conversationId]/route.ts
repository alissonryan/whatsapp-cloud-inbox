import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultTenant } from '@/lib/tenant';
import { normalizeWaId } from '@/lib/whatsapp/waid';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      mode: 'send-only' as const,
      conversationId,
      data: [],
      paging: null
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsedLimit = Number.parseInt(searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50;

    const tenant = await getOrCreateDefaultTenant();

    const resolvedConversationId = (() => {
      if (conversationId.startsWith('temp:')) return undefined;
      return conversationId;
    })();

    const conversation =
      (resolvedConversationId
        ? await prisma.conversation.findFirst({
            where: { id: resolvedConversationId, tenantId: tenant.id },
            include: { contact: true, phoneNumber: true }
          })
        : null) ??
      (conversationId.startsWith('temp:')
        ? await prisma.conversation.findFirst({
            where: {
              tenantId: tenant.id,
              contact: { waId: normalizeWaId(conversationId.slice('temp:'.length)) }
            },
            include: { contact: true, phoneNumber: true },
            orderBy: { lastActiveAt: 'desc' }
          })
        : null);

    if (!conversation) {
      return NextResponse.json({
        mode: 'db' as const,
        conversationId,
        data: [],
        paging: null
      });
    }

    const messages = await prisma.message.findMany({
      where: { tenantId: tenant.id, conversationId: conversation.id },
      orderBy: { timestamp: 'asc' },
      take: limit
    });

    const transformed = messages.map((m) => {
      const raw = m.rawPayload as unknown as Record<string, unknown> | null;

      const reaction = m.type === 'reaction' && raw && typeof raw.reaction === 'object' && raw.reaction
        ? (raw.reaction as { emoji?: unknown; message_id?: unknown })
        : null;

      const reactionEmoji = typeof reaction?.emoji === 'string' ? reaction.emoji : null;
      const reactedToMessageId = typeof reaction?.message_id === 'string' ? reaction.message_id : null;

      const mediaUrl = m.mediaId ? `/api/media/${m.mediaId}` : undefined;

      return {
        id: m.metaMessageId,
        direction: m.direction === 'outbound' ? 'outbound' : 'inbound',
        content: m.content ?? '',
        createdAt: m.timestamp.toISOString(),
        status: m.status ?? undefined,
        phoneNumber: m.fromWaId ?? m.toWaId ?? conversation.contact.waId,
        hasMedia: Boolean(m.mediaId) || ['image', 'video', 'audio', 'document', 'sticker'].includes(m.type),
        mediaData: mediaUrl
          ? {
              url: mediaUrl,
              contentType: m.mimeType ?? undefined,
              filename: m.filename ?? undefined
            }
          : undefined,
        reactionEmoji,
        reactedToMessageId,
        filename: m.filename ?? null,
        mimeType: m.mimeType ?? null,
        messageType: m.type,
        caption: m.caption ?? null,
        metadata: m.mediaId ? { mediaId: m.mediaId } : undefined
      };
    });

    return NextResponse.json({
      mode: 'db' as const,
      conversationId: conversation.id,
      data: transformed,
      paging: null
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', conversationId },
      { status: 500 }
    );
  }
}

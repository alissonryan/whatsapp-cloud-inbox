import { NextResponse } from 'next/server';
import { sendInteractiveButtons } from '@/lib/meta/whatsapp';
import { prisma } from '@/lib/db';
import { getMetaWhatsappEnv } from '@/lib/env';
import { getOrCreateDefaultTenant } from '@/lib/tenant';
import { normalizeWaId } from '@/lib/whatsapp/waid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, header, body: bodyText, buttons } = body;

    if (!phoneNumber || !bodyText || !buttons || buttons.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: phoneNumber, body, buttons' },
        { status: 400 }
      );
    }

    const to = normalizeWaId(String(phoneNumber));
    if (!to) {
      return NextResponse.json(
        { error: 'Invalid phoneNumber' },
        { status: 400 }
      );
    }

    // Validate buttons
    if (buttons.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 buttons allowed' },
        { status: 400 }
      );
    }

    const canUseDb = Boolean(process.env.DATABASE_URL);
    const devAllowFreeform = process.env.NEXT_PUBLIC_INBOX_DEV_ALLOW_FREEFORM === 'true';
    let conversationDbId: string | undefined;
    let tenantId: string | undefined;

    if (canUseDb) {
      const tenant = await getOrCreateDefaultTenant();
      tenantId = tenant.id;
      const metaEnv = getMetaWhatsappEnv();

      const phoneNumberRow = await prisma.whatsappPhoneNumber.upsert({
        where: { phoneNumberId: metaEnv.phoneNumberId },
        update: { wabaId: metaEnv.wabaId },
        create: { tenantId: tenant.id, wabaId: metaEnv.wabaId, phoneNumberId: metaEnv.phoneNumberId }
      });

      const contact = await prisma.contact.upsert({
        where: { tenantId_waId: { tenantId: tenant.id, waId: to } },
        update: {},
        create: { tenantId: tenant.id, waId: to }
      });

      const conversation = await prisma.conversation.upsert({
        where: {
          tenantId_phoneNumberDbId_contactId: {
            tenantId: tenant.id,
            phoneNumberDbId: phoneNumberRow.id,
            contactId: contact.id
          }
        },
        update: { status: 'active' },
        create: { tenantId: tenant.id, phoneNumberDbId: phoneNumberRow.id, contactId: contact.id, status: 'active' }
      });
      conversationDbId = conversation.id;

      if (!devAllowFreeform) {
        const lastInbound = await prisma.message.findFirst({
          where: { tenantId: tenant.id, conversationId: conversation.id, direction: 'inbound' },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true }
        });
        const within24h =
          lastInbound &&
          Date.now() - lastInbound.timestamp.getTime() < 24 * 60 * 60 * 1000;
        if (!within24h) {
          return NextResponse.json(
            { error: 'Outside 24-hour window. Send a template message instead.' },
            { status: 422 }
          );
        }
      }
    }

    // Build interactive button message payload
    const payload: {
      to: string;
      bodyText: string;
      header?: { type: 'text'; text: string };
      buttons: Array<{ id: string; title: string }>;
    } = {
      to,
      bodyText,
      buttons: buttons.map((btn: { id: string; title: string }) => ({
        id: btn.id,
        title: btn.title.substring(0, 20) // Ensure max 20 chars
      }))
    };

    // Add header if provided
    if (header) {
      payload.header = {
        type: 'text',
        text: header
      };
    }

    // Send interactive button message
    const result = await sendInteractiveButtons(payload);

    if (canUseDb && conversationDbId && tenantId) {
      const now = new Date();
      const metaMessageId = result?.messages?.[0]?.id;
      if (metaMessageId) {
        await prisma.$transaction(async (tx) => {
          await tx.message.create({
            data: {
              tenantId,
              conversationId: conversationDbId,
              metaMessageId,
              direction: 'outbound',
              type: 'interactive',
              content: bodyText,
              caption: null,
              timestamp: now,
              fromWaId: null,
              toWaId: to,
              mediaId: null,
              mimeType: null,
              filename: null,
              status: 'sent',
              statusUpdatedAt: now,
              rawPayload: {
                kind: 'outbound_interactive',
                header,
                bodyText,
                buttons
              } as unknown as object
            }
          });

          await tx.conversation.update({
            where: { id: conversationDbId },
            data: {
              messagesCount: { increment: 1 },
              lastActiveAt: now,
              lastMessageAt: now,
              lastMessageText: bodyText,
              lastMessageDirection: 'outbound',
              lastMessageType: 'interactive'
            }
          });
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending interactive message:', error);
    return NextResponse.json(
      { error: 'Failed to send interactive message' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { sendAudio, sendDocument, sendImage, sendText, sendVideo, uploadMedia } from '@/lib/meta/whatsapp';
import { prisma } from '@/lib/db';
import { getMetaWhatsappEnv } from '@/lib/env';
import { getOrCreateDefaultTenant } from '@/lib/tenant';
import { normalizeWaId } from '@/lib/whatsapp/waid';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const toInput = formData.get('to') as string;
    const body = formData.get('body') as string;
    const file = formData.get('file') as File | null;

    if (!toInput) {
      return NextResponse.json(
        { error: 'Missing required field: to' },
        { status: 400 }
      );
    }

    const to = normalizeWaId(toInput);
    if (!to) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    let result;
    let local: { uploadedMediaId: string; mediaType: string; filename: string; mimeType: string } | undefined;
    let conversationDbId: string | undefined;

    const canUseDb = Boolean(process.env.DATABASE_URL);
    const devAllowFreeform = process.env.NEXT_PUBLIC_INBOX_DEV_ALLOW_FREEFORM === 'true';

    if (canUseDb) {
      const tenant = await getOrCreateDefaultTenant();
      const metaEnv = getMetaWhatsappEnv();

      const phoneNumber = await prisma.whatsappPhoneNumber.upsert({
        where: { phoneNumberId: metaEnv.phoneNumberId },
        update: { wabaId: metaEnv.wabaId },
        create: {
          tenantId: tenant.id,
          wabaId: metaEnv.wabaId,
          phoneNumberId: metaEnv.phoneNumberId
        }
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
            phoneNumberDbId: phoneNumber.id,
            contactId: contact.id
          }
        },
        update: { status: 'active' },
        create: {
          tenantId: tenant.id,
          phoneNumberDbId: phoneNumber.id,
          contactId: contact.id,
          status: 'active'
        }
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

    // Send media message
    if (file) {
      const fileType = file.type.split('/')[0]; // image, video, audio, application
      const mediaType: 'image' | 'video' | 'audio' | 'document' =
        fileType === 'image' || fileType === 'video' || fileType === 'audio' ? fileType : 'document';

      // Upload media first
      const uploadResult = await uploadMedia({
        type: mediaType,
        file,
        fileName: file.name
      });
      local = {
        uploadedMediaId: uploadResult.id,
        mediaType,
        filename: file.name,
        mimeType: file.type
      };

      // Send message with media
      if (mediaType === 'image') {
        result = await sendImage({
          to,
          image: { id: uploadResult.id, caption: body || undefined }
        });
      } else if (mediaType === 'video') {
        result = await sendVideo({
          to,
          video: { id: uploadResult.id, caption: body || undefined }
        });
      } else if (mediaType === 'audio') {
        result = await sendAudio({
          to,
          audio: { id: uploadResult.id }
        });
      } else {
        result = await sendDocument({
          to,
          document: { id: uploadResult.id, caption: body || undefined, filename: file.name }
        });
      }
    } else if (body) {
      // Send text message
      result = await sendText({
        to,
        body
      });
    } else {
      return NextResponse.json(
        { error: 'Either body or file is required' },
        { status: 400 }
      );
    }

    if (canUseDb && conversationDbId) {
      const tenant = await getOrCreateDefaultTenant();
      const now = new Date();
      const metaMessageId = result?.messages?.[0]?.id as string | undefined;
      const type = local?.mediaType ?? 'text';
      const content = !local ? body : '';
      const caption = local ? (body || undefined) : undefined;
      const preview = (content && content.trim()) ? content : caption ? caption : `[${type}]`;

      if (metaMessageId) {
        await prisma.$transaction(async (tx) => {
          await tx.message.create({
            data: {
              tenantId: tenant.id,
              conversationId: conversationDbId,
              metaMessageId,
              direction: 'outbound',
              type,
              content: content || null,
              caption: caption || null,
              timestamp: now,
              fromWaId: null,
              toWaId: to,
              mediaId: local?.uploadedMediaId ?? null,
              mimeType: local?.mimeType ?? null,
              filename: local?.filename ?? null,
              status: 'sent',
              statusUpdatedAt: now,
              rawPayload: {
                kind: 'outbound_send',
                to,
                response: result,
                local
              } as unknown as object
            }
          });

          await tx.conversation.update({
            where: { id: conversationDbId },
            data: {
              messagesCount: { increment: 1 },
              lastActiveAt: now,
              lastMessageAt: now,
              lastMessageText: preview,
              lastMessageDirection: 'outbound',
              lastMessageType: type
            }
          });
        });
      }
    }

    return NextResponse.json({
      ...result,
      _local: {
        ...(local ?? {}),
        ...(conversationDbId ? { conversationId: conversationDbId } : {})
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

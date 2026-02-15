import { NextResponse } from 'next/server';
import type { TemplateParameterInfo, TemplateParameters } from '@/types/whatsapp';
import { sendTemplate } from '@/lib/meta/whatsapp';
import { buildMetaTemplatePayload } from '@/lib/meta/template-payload';
import { prisma } from '@/lib/db';
import { getMetaWhatsappEnv } from '@/lib/env';
import { getOrCreateDefaultTenant } from '@/lib/tenant';
import { normalizeWaId } from '@/lib/whatsapp/waid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, templateName, languageCode, parameters, parameterInfo } = body;

    if (!to || !templateName || !languageCode) {
      return NextResponse.json(
        { error: 'Missing required fields: to, templateName, languageCode' },
        { status: 400 }
      );
    }

    const normalizedTo = normalizeWaId(String(to));
    if (!normalizedTo) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const canUseDb = Boolean(process.env.DATABASE_URL);
    let tenantId: string | undefined;
    let conversationDbId: string | undefined;

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
        where: { tenantId_waId: { tenantId: tenant.id, waId: normalizedTo } },
        update: {},
        create: { tenantId: tenant.id, waId: normalizedTo }
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
    }

    const template = buildMetaTemplatePayload({
      name: templateName,
      languageCode,
      parameters: parameters as TemplateParameters | undefined,
      parameterInfo: parameterInfo as TemplateParameterInfo | undefined
    });

    const result = await sendTemplate({ to: normalizedTo, template });

    if (canUseDb && tenantId && conversationDbId) {
      const now = new Date();
      const metaMessageId = result?.messages?.[0]?.id;
      if (metaMessageId) {
        const preview = `[template] ${templateName}`;
        await prisma.$transaction(async (tx) => {
          await tx.message.create({
            data: {
              tenantId,
              conversationId: conversationDbId,
              metaMessageId,
              direction: 'outbound',
              type: 'template',
              content: null,
              caption: null,
              timestamp: now,
              fromWaId: null,
              toWaId: normalizedTo,
              mediaId: null,
              mimeType: null,
              filename: null,
              status: 'sent',
              statusUpdatedAt: now,
              rawPayload: {
                kind: 'outbound_template',
                templateName,
                languageCode,
                parameters: parameters ?? null
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
              lastMessageType: 'template'
            }
          });
        });
      }
    }

    return NextResponse.json({
      ...result,
      _local: conversationDbId ? { conversationId: conversationDbId } : undefined
    });
  } catch (error) {
    console.error('Error sending template:', error);
    return NextResponse.json(
      { error: 'Failed to send template message' },
      { status: 500 }
    );
  }
}

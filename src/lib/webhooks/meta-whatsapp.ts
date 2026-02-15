import { Prisma, type PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getOrCreateDefaultTenant } from '@/lib/tenant';
import { normalizeWaId } from '@/lib/whatsapp/waid';

type ContactNameMap = Map<string, string>;

function toUnixSecondsDate(value: unknown): Date | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (Number.isFinite(num)) return new Date(num * 1000);
  }
  return null;
}

function getPreviewText(args: { type: string; content?: string | null; caption?: string | null }): string {
  if (args.content && args.content.trim()) return args.content;
  if (args.caption && args.caption.trim()) return args.caption;
  return `[${args.type}]`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function collectContactNames(contacts: unknown): ContactNameMap {
  const map: ContactNameMap = new Map();
  if (!Array.isArray(contacts)) return map;

  for (const contact of contacts) {
    const waIdRaw = (contact as { wa_id?: unknown })?.wa_id;
    const waId = typeof waIdRaw === 'string' ? normalizeWaId(waIdRaw) : '';
    if (!waId) continue;

    const nameRaw = (contact as { profile?: { name?: unknown } })?.profile?.name;
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
    if (!name) continue;

    map.set(waId, name);
  }

  return map;
}

function extractMedia(msg: Record<string, unknown>): {
  mediaId?: string;
  mimeType?: string;
  filename?: string;
  caption?: string;
} {
  const type = typeof msg.type === 'string' ? msg.type : '';

  if (type === 'image' && typeof msg.image === 'object' && msg.image) {
    const image = msg.image as { id?: unknown; mime_type?: unknown; caption?: unknown };
    return {
      mediaId: typeof image.id === 'string' ? image.id : undefined,
      mimeType: typeof image.mime_type === 'string' ? image.mime_type : undefined,
      caption: typeof image.caption === 'string' ? image.caption : undefined
    };
  }

  if (type === 'video' && typeof msg.video === 'object' && msg.video) {
    const video = msg.video as { id?: unknown; mime_type?: unknown; caption?: unknown };
    return {
      mediaId: typeof video.id === 'string' ? video.id : undefined,
      mimeType: typeof video.mime_type === 'string' ? video.mime_type : undefined,
      caption: typeof video.caption === 'string' ? video.caption : undefined
    };
  }

  if (type === 'audio' && typeof msg.audio === 'object' && msg.audio) {
    const audio = msg.audio as { id?: unknown; mime_type?: unknown };
    return {
      mediaId: typeof audio.id === 'string' ? audio.id : undefined,
      mimeType: typeof audio.mime_type === 'string' ? audio.mime_type : undefined
    };
  }

  if (type === 'document' && typeof msg.document === 'object' && msg.document) {
    const document = msg.document as { id?: unknown; mime_type?: unknown; caption?: unknown; filename?: unknown };
    return {
      mediaId: typeof document.id === 'string' ? document.id : undefined,
      mimeType: typeof document.mime_type === 'string' ? document.mime_type : undefined,
      caption: typeof document.caption === 'string' ? document.caption : undefined,
      filename: typeof document.filename === 'string' ? document.filename : undefined
    };
  }

  if (type === 'sticker' && typeof msg.sticker === 'object' && msg.sticker) {
    const sticker = msg.sticker as { id?: unknown; mime_type?: unknown };
    return {
      mediaId: typeof sticker.id === 'string' ? sticker.id : undefined,
      mimeType: typeof sticker.mime_type === 'string' ? sticker.mime_type : undefined
    };
  }

  return {};
}

function extractTextContent(msg: Record<string, unknown>): string | undefined {
  const type = typeof msg.type === 'string' ? msg.type : '';
  if (type !== 'text') return undefined;
  const text = msg.text as { body?: unknown } | undefined;
  return typeof text?.body === 'string' ? text.body : undefined;
}

async function ingestInboundMessage(db: PrismaClient, args: {
  tenantId: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  contactNames: ContactNameMap;
  msg: Record<string, unknown>;
}) {
  const metaMessageId = typeof args.msg.id === 'string' ? args.msg.id : '';
  if (!metaMessageId) return;

  const fromRaw = (args.msg as { from?: unknown }).from;
  const fromWaId = typeof fromRaw === 'string' ? normalizeWaId(fromRaw) : '';
  if (!fromWaId) return;

  const timestamp = toUnixSecondsDate((args.msg as { timestamp?: unknown }).timestamp) ?? new Date();
  const type = typeof args.msg.type === 'string' ? args.msg.type : 'unknown';

  const content = extractTextContent(args.msg);
  const media = extractMedia(args.msg);
  const caption = media.caption;
  const filename = media.filename;
  const mimeType = media.mimeType;
  const mediaId = media.mediaId;

  const contactName = args.contactNames.get(fromWaId);

  await db.$transaction(async (tx) => {
    const phoneNumber = await tx.whatsappPhoneNumber.upsert({
      where: { phoneNumberId: args.phoneNumberId },
      update: {
        wabaId: args.wabaId,
        ...(args.displayPhoneNumber ? { displayPhoneNumber: args.displayPhoneNumber } : {})
      },
      create: {
        tenantId: args.tenantId,
        wabaId: args.wabaId,
        phoneNumberId: args.phoneNumberId,
        ...(args.displayPhoneNumber ? { displayPhoneNumber: args.displayPhoneNumber } : {})
      }
    });

    const contact = await tx.contact.upsert({
      where: { tenantId_waId: { tenantId: args.tenantId, waId: fromWaId } },
      update: {
        ...(contactName ? { name: contactName } : {})
      },
      create: {
        tenantId: args.tenantId,
        waId: fromWaId,
        ...(contactName ? { name: contactName } : {})
      }
    });

    const conversation = await tx.conversation.upsert({
      where: {
        tenantId_phoneNumberDbId_contactId: {
          tenantId: args.tenantId,
          phoneNumberDbId: phoneNumber.id,
          contactId: contact.id
        }
      },
      update: {
        lastActiveAt: timestamp,
        status: 'active'
      },
      create: {
        tenantId: args.tenantId,
        phoneNumberDbId: phoneNumber.id,
        contactId: contact.id,
        status: 'active',
        lastActiveAt: timestamp
      }
    });

    let created = false;
    try {
      await tx.message.create({
        data: {
          tenantId: args.tenantId,
          conversationId: conversation.id,
          metaMessageId,
          direction: 'inbound',
          type,
          content: content ?? null,
          caption: caption ?? null,
          timestamp,
          fromWaId,
          toWaId: null,
          mediaId: mediaId ?? null,
          mimeType: mimeType ?? null,
          filename: filename ?? null,
          rawPayload: args.msg as unknown as Prisma.InputJsonValue
        }
      });
      created = true;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }

    if (created) {
      const preview = getPreviewText({ type, content, caption });
      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          messagesCount: { increment: 1 },
          lastActiveAt: timestamp,
          lastMessageAt: timestamp,
          lastMessageText: preview,
          lastMessageDirection: 'inbound',
          lastMessageType: type
        }
      });
    }
  });
}

async function ingestStatusUpdate(db: PrismaClient, args: {
  tenantId: string;
  status: Record<string, unknown>;
}) {
  const metaMessageId = typeof args.status.id === 'string' ? args.status.id : '';
  const statusValue = typeof args.status.status === 'string' ? args.status.status : '';
  if (!metaMessageId || !statusValue) return;

  const timestamp = toUnixSecondsDate(args.status.timestamp) ?? new Date();

  await db.$transaction(async (tx) => {
    const message = await tx.message.findUnique({
      where: { metaMessageId },
      select: { id: true, statusUpdatedAt: true }
    });
    if (!message) return;

    try {
      await tx.messageStatus.create({
        data: {
          messageId: message.id,
          status: statusValue,
          timestamp,
          rawPayload: args.status as unknown as Prisma.InputJsonValue
        }
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }

    const shouldUpdate =
      !message.statusUpdatedAt || timestamp.getTime() >= message.statusUpdatedAt.getTime();

    if (shouldUpdate) {
      await tx.message.update({
        where: { id: message.id },
        data: {
          status: statusValue,
          statusUpdatedAt: timestamp
        }
      });
    }
  });
}

export async function ingestMetaWhatsAppWebhook(payload: unknown): Promise<void> {
  if (!payload || typeof payload !== 'object') return;

  const entries = Array.isArray((payload as { entry?: unknown }).entry)
    ? ((payload as { entry: unknown[] }).entry as unknown[])
    : [];

  if (entries.length === 0) return;

  const tenant = await getOrCreateDefaultTenant();

  for (const entry of entries) {
    const entryObj = entry as { id?: unknown; changes?: unknown };
    const wabaId = typeof entryObj.id === 'string' ? entryObj.id : '';
    const changes = Array.isArray(entryObj.changes) ? (entryObj.changes as unknown[]) : [];

    for (const change of changes) {
      const value = (change as { value?: unknown })?.value;
      if (!value || typeof value !== 'object') continue;

      const valueObj = value as { metadata?: unknown; contacts?: unknown; messages?: unknown; statuses?: unknown };
      const metadata = valueObj.metadata as { phone_number_id?: unknown; display_phone_number?: unknown } | undefined;
      const phoneNumberId = typeof metadata?.phone_number_id === 'string' ? metadata.phone_number_id : '';
      if (!phoneNumberId) continue;

      const displayPhoneNumber = typeof metadata?.display_phone_number === 'string' ? metadata.display_phone_number : undefined;
      const contactNames = collectContactNames(valueObj.contacts);

      const messages = Array.isArray(valueObj.messages) ? (valueObj.messages as unknown[]) : [];
      for (const msg of messages) {
        if (!msg || typeof msg !== 'object') continue;
        await ingestInboundMessage(prisma, {
          tenantId: tenant.id,
          wabaId: wabaId || phoneNumberId,
          phoneNumberId,
          displayPhoneNumber,
          contactNames,
          msg: msg as Record<string, unknown>
        });
      }

      const statuses = Array.isArray(valueObj.statuses) ? (valueObj.statuses as unknown[]) : [];
      for (const status of statuses) {
        if (!status || typeof status !== 'object') continue;
        await ingestStatusUpdate(prisma, {
          tenantId: tenant.id,
          status: status as Record<string, unknown>
        });
      }
    }
  }
}


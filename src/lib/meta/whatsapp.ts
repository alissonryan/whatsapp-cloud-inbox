import { getMetaWhatsappEnv } from '@/lib/env';
import { graphFetchArrayBuffer, graphFetchJson } from '@/lib/meta/graph';

export type MetaSendMessageResponse = {
  messaging_product?: 'whatsapp';
  contacts?: Array<{ input?: string; wa_id?: string }>;
  messages?: Array<{ id: string }>;
};

export type MetaUploadMediaResponse = {
  id: string;
};

export type MetaMediaInfo = {
  id: string;
  url?: string;
  mime_type?: string;
  sha256?: string;
  file_size?: number;
  messaging_product?: 'whatsapp';
};

export type MetaTemplate = {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components?: unknown[];
};

export type MetaPaging = {
  cursors?: { before?: string; after?: string };
  next?: string;
  previous?: string;
};

export type MetaListTemplatesResponse = {
  data: MetaTemplate[];
  paging?: MetaPaging;
};

type MediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker';

export async function uploadMedia(args: {
  phoneNumberId?: string;
  type: Exclude<MediaType, 'sticker'>;
  file: File;
  fileName?: string;
}): Promise<MetaUploadMediaResponse> {
  const env = getMetaWhatsappEnv();
  const phoneNumberId = args.phoneNumberId ?? env.phoneNumberId;

  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', args.type);
  form.append('file', args.file, args.fileName ?? args.file.name);

  return graphFetchJson<MetaUploadMediaResponse>(env, {
    pathOrUrl: `/${phoneNumberId}/media`,
    method: 'POST',
    body: form
  });
}

export async function getMedia(args: { mediaId: string }): Promise<MetaMediaInfo> {
  const env = getMetaWhatsappEnv();
  return graphFetchJson<MetaMediaInfo>(env, {
    pathOrUrl: `/${args.mediaId}`,
    method: 'GET'
  });
}

export async function downloadMediaByUrl(args: { url: string }): Promise<ArrayBuffer> {
  const env = getMetaWhatsappEnv();
  return graphFetchArrayBuffer(env, { pathOrUrl: args.url, method: 'GET' });
}

export async function sendText(args: {
  phoneNumberId?: string;
  to: string;
  body: string;
  previewUrl?: boolean;
}): Promise<MetaSendMessageResponse> {
  const env = getMetaWhatsappEnv();
  const phoneNumberId = args.phoneNumberId ?? env.phoneNumberId;

  return graphFetchJson<MetaSendMessageResponse>(env, {
    pathOrUrl: `/${phoneNumberId}/messages`,
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: args.to,
      type: 'text',
      text: {
        body: args.body,
        ...(typeof args.previewUrl === 'boolean' ? { preview_url: args.previewUrl } : {})
      }
    }
  });
}

async function sendMediaMessage(args: {
  phoneNumberId?: string;
  to: string;
  mediaType: MediaType;
  mediaId: string;
  caption?: string;
  filename?: string;
}): Promise<MetaSendMessageResponse> {
  const env = getMetaWhatsappEnv();
  const phoneNumberId = args.phoneNumberId ?? env.phoneNumberId;

  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: args.to,
    type: args.mediaType,
    [args.mediaType]: {
      id: args.mediaId,
      ...(args.caption ? { caption: args.caption } : {}),
      ...(args.mediaType === 'document' && args.filename ? { filename: args.filename } : {})
    }
  };

  return graphFetchJson<MetaSendMessageResponse>(env, {
    pathOrUrl: `/${phoneNumberId}/messages`,
    method: 'POST',
    body
  });
}

export async function sendImage(args: { phoneNumberId?: string; to: string; image: { id: string; caption?: string } }) {
  return sendMediaMessage({
    phoneNumberId: args.phoneNumberId,
    to: args.to,
    mediaType: 'image',
    mediaId: args.image.id,
    caption: args.image.caption
  });
}

export async function sendVideo(args: { phoneNumberId?: string; to: string; video: { id: string; caption?: string } }) {
  return sendMediaMessage({
    phoneNumberId: args.phoneNumberId,
    to: args.to,
    mediaType: 'video',
    mediaId: args.video.id,
    caption: args.video.caption
  });
}

export async function sendAudio(args: { phoneNumberId?: string; to: string; audio: { id: string } }) {
  return sendMediaMessage({
    phoneNumberId: args.phoneNumberId,
    to: args.to,
    mediaType: 'audio',
    mediaId: args.audio.id
  });
}

export async function sendDocument(args: { phoneNumberId?: string; to: string; document: { id: string; caption?: string; filename?: string } }) {
  return sendMediaMessage({
    phoneNumberId: args.phoneNumberId,
    to: args.to,
    mediaType: 'document',
    mediaId: args.document.id,
    caption: args.document.caption,
    filename: args.document.filename
  });
}

export async function sendInteractiveButtons(args: {
  phoneNumberId?: string;
  to: string;
  bodyText: string;
  header?: { type: 'text'; text: string };
  buttons: Array<{ id: string; title: string }>;
}): Promise<MetaSendMessageResponse> {
  const env = getMetaWhatsappEnv();
  const phoneNumberId = args.phoneNumberId ?? env.phoneNumberId;

  const interactive: Record<string, unknown> = {
    type: 'button',
    body: { text: args.bodyText },
    action: {
      buttons: args.buttons.map((b) => ({
        type: 'reply',
        reply: { id: b.id, title: b.title }
      }))
    }
  };

  if (args.header) {
    interactive.header = { type: 'text', text: args.header.text };
  }

  return graphFetchJson<MetaSendMessageResponse>(env, {
    pathOrUrl: `/${phoneNumberId}/messages`,
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: args.to,
      type: 'interactive',
      interactive
    }
  });
}

export type MetaTemplatePayload = {
  name: string;
  language: { code: string };
  components?: unknown[];
};

export async function sendTemplate(args: {
  phoneNumberId?: string;
  to: string;
  template: MetaTemplatePayload;
}): Promise<MetaSendMessageResponse> {
  const env = getMetaWhatsappEnv();
  const phoneNumberId = args.phoneNumberId ?? env.phoneNumberId;

  return graphFetchJson<MetaSendMessageResponse>(env, {
    pathOrUrl: `/${phoneNumberId}/messages`,
    method: 'POST',
    body: {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: args.to,
      type: 'template',
      template: args.template
    }
  });
}

export async function listTemplates(args?: { wabaId?: string; limit?: number }): Promise<MetaListTemplatesResponse> {
  const env = getMetaWhatsappEnv();
  const wabaId = args?.wabaId ?? env.wabaId;
  const limit = args?.limit ?? 100;

  return graphFetchJson<MetaListTemplatesResponse>(env, {
    pathOrUrl: `/${wabaId}/message_templates`,
    method: 'GET',
    query: {
      limit,
      // Fields required by our frontend/template parser.
      fields: 'id,name,category,language,status,components'
    }
  });
}


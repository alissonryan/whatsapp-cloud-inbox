import { NextResponse } from 'next/server';
import { isValidMetaSignature } from '@/lib/webhooks/meta-signature';
import { ingestMetaWhatsAppWebhook } from '@/lib/webhooks/meta-whatsapp';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} environment variable is not set`);
  }
  return value.trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !challenge) {
    return NextResponse.json({ error: 'Invalid webhook verification request' }, { status: 400 });
  }

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken || token !== verifyToken) {
    return NextResponse.json({ error: 'Invalid verify token' }, { status: 403 });
  }

  return new NextResponse(challenge, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const appSecret = requireEnv('META_APP_SECRET');
    const raw = new Uint8Array(await request.arrayBuffer());

    const signatureHeader = request.headers.get('x-hub-signature-256');
    const ok = isValidMetaSignature({ appSecret, rawBody: raw, signatureHeader });
    if (!ok) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(raw).toString('utf8')) as unknown;
    await ingestMetaWhatsAppWebhook(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}


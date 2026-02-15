import { createHmac, timingSafeEqual } from 'crypto';

export function isValidMetaSignature(args: {
  appSecret: string;
  rawBody: Uint8Array;
  signatureHeader: string | null;
}): boolean {
  const header = args.signatureHeader;
  if (!header) return false;

  const match = /^sha256=([a-f0-9]+)$/i.exec(header.trim());
  if (!match) return false;

  const providedHex = match[1].toLowerCase();
  const expectedHex = createHmac('sha256', args.appSecret).update(args.rawBody).digest('hex');

  try {
    const provided = Buffer.from(providedHex, 'hex');
    const expected = Buffer.from(expectedHex, 'hex');
    if (provided.length !== expected.length) return false;
    return timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}


type RequiredEnv = 'META_ACCESS_TOKEN';

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requireEnv(name: RequiredEnv): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

export type MetaWhatsappEnv = {
  accessToken: string;
  graphBaseUrl: string;
  graphVersion: string;
  phoneNumberId: string;
  wabaId: string;
};

export function getMetaWhatsappEnv(): MetaWhatsappEnv {
  const accessToken = requireEnv('META_ACCESS_TOKEN');

  // Prefer new names, but keep backwards-compatible fallbacks for now.
  const phoneNumberId =
    readEnv('WHATSAPP_PHONE_NUMBER_ID') ??
    readEnv('PHONE_NUMBER_ID') ??
    '';
  if (!phoneNumberId) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID (or PHONE_NUMBER_ID) environment variable is not set');
  }

  const wabaId =
    readEnv('WHATSAPP_WABA_ID') ??
    readEnv('WABA_ID') ??
    '';
  if (!wabaId) {
    throw new Error('WHATSAPP_WABA_ID (or WABA_ID) environment variable is not set');
  }

  const graphVersion = readEnv('META_GRAPH_VERSION') ?? 'v24.0';
  const graphBaseUrl = readEnv('META_GRAPH_BASE_URL') ?? 'https://graph.facebook.com';

  return { accessToken, graphBaseUrl, graphVersion, phoneNumberId, wabaId };
}


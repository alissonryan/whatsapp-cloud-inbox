import type { MetaWhatsappEnv } from '@/lib/env';

export type GraphApiError = {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
  error_user_title?: string;
  error_user_msg?: string;
  is_transient?: boolean;
};

export class GraphApiResponseError extends Error {
  status: number;
  error?: GraphApiError;
  responseText?: string;

  constructor(args: { status: number; message: string; error?: GraphApiError; responseText?: string }) {
    super(args.message);
    this.name = 'GraphApiResponseError';
    this.status = args.status;
    this.error = args.error;
    this.responseText = args.responseText;
  }
}

function buildGraphUrl(env: MetaWhatsappEnv, pathOrUrl: string, query?: Record<string, string | number | boolean | undefined>) {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const url = isAbsolute
    ? new URL(pathOrUrl)
    : new URL(`${env.graphBaseUrl.replace(/\/$/, '')}/${env.graphVersion.replace(/^\//, '')}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export async function graphFetch(env: MetaWhatsappEnv, args: {
  pathOrUrl: string;
  method?: string;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<Response> {
  const url = buildGraphUrl(env, args.pathOrUrl, args.query);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.accessToken}`,
    ...(args.headers ?? {})
  };

  const method = args.method ?? (args.body ? 'POST' : 'GET');
  const body = args.body;

  const init: RequestInit = { method, headers };

  if (body !== undefined) {
    if (typeof body === 'string' || body instanceof Uint8Array || body instanceof ArrayBuffer) {
      init.body = body as BodyInit;
    } else if (isFormData(body)) {
      // Let fetch set the proper multipart boundary.
      init.body = body;
    } else {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  return fetch(url, init);
}

async function readResponseTextSafe(response: Response): Promise<string | undefined> {
  try {
    const text = await response.text();
    return text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
}

export async function graphFetchJson<T>(env: MetaWhatsappEnv, args: Parameters<typeof graphFetch>[1]): Promise<T> {
  const response = await graphFetch(env, args);

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    const data = isJson ? await response.json().catch(() => null) : null;
    const err = (data as { error?: GraphApiError } | null)?.error;
    if (err) {
      throw new GraphApiResponseError({
        status: response.status,
        message: err.message ?? `Graph API request failed with status ${response.status}`,
        error: err
      });
    }

    const text = await readResponseTextSafe(response);
    throw new GraphApiResponseError({
      status: response.status,
      message: `Graph API request failed with status ${response.status}`,
      responseText: text
    });
  }

  if (!isJson) {
    // Some Graph endpoints may return empty/other content types on success.
    return (undefined as unknown) as T;
  }

  return (await response.json()) as T;
}

export async function graphFetchArrayBuffer(env: MetaWhatsappEnv, args: Parameters<typeof graphFetch>[1]): Promise<ArrayBuffer> {
  const response = await graphFetch(env, args);
  if (!response.ok) {
    const text = await readResponseTextSafe(response);
    throw new GraphApiResponseError({
      status: response.status,
      message: `Graph API request failed with status ${response.status}`,
      responseText: text
    });
  }
  return response.arrayBuffer();
}

import { API_BASE_URL } from '../config';
import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

export const isApiError = (err: unknown): err is ApiError => err instanceof ApiError;

interface Envelope<T> {
  ok: boolean;
  data: T;
  error?: ApiErrorBody;
  serverTime: string;
}

/**
 * Mutable request context (auth token + language) set by the providers.
 * Kept outside React so the client stays a plain module.
 */
const context = { token: null as string | null, lang: 'en' as string };
export const setAuthToken = (token: string | null) => {
  context.token = token;
};
export const setRequestLang = (lang: string) => {
  context.lang = lang;
};

/**
 * Clock offset (server - device) in ms, refreshed on every response. Used so
 * countdowns are correct even when the device clock is wrong.
 */
let clockOffsetMs = 0;
const offsetListeners = new Set<(offset: number) => void>();
export const getServerNow = () => new Date(Date.now() + clockOffsetMs);
export const subscribeClockOffset = (fn: (offset: number) => void) => {
  offsetListeners.add(fn);
  return () => offsetListeners.delete(fn);
};

function recordServerTime(serverTime?: string, requestStartedAt?: number) {
  if (!serverTime) return;
  const serverMs = Date.parse(serverTime);
  if (Number.isNaN(serverMs)) return;
  // Compensate for half the round-trip so the offset is centred on the request.
  const halfRtt = requestStartedAt ? (Date.now() - requestStartedAt) / 2 : 0;
  clockOffsetMs = serverMs + halfRtt - Date.now();
  offsetListeners.forEach((fn) => fn(clockOffsetMs));
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  url.searchParams.set('lang', context.lang);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': context.lang,
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (context.token) headers.Authorization = `Bearer ${context.token}`;

  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (err) {
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: `Cannot reach ${API_BASE_URL}` });
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }
  recordServerTime(envelope?.serverTime, startedAt);

  if (!response.ok || !envelope?.ok) {
    throw new ApiError(
      response.status,
      envelope?.error ?? { code: 'HTTP_ERROR', message: `Request failed (${response.status})` }
    );
  }
  return envelope.data;
}

import { ofetch, type $Fetch, type FetchOptions } from 'ofetch';
import type { RequestOptions } from './types.js';

// ofetch's default list also retries 409 and 425, which a chat completion request never recovers from.
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

type RequestFetchOptions = Pick<FetchOptions, 'retry' | 'retryDelay' | 'headers' | 'signal'>;

export const http: $Fetch = ofetch.create({
  retryStatusCodes: RETRY_STATUS_CODES,
  onRequestError({ error, options }) {
    // A timed-out or aborted signal stays aborted, so retrying would only fail again after retryDelay.
    if (options.signal?.aborted) throw error;
  },
});

function withoutUndefined(options: RequestOptions): RequestOptions {
  return Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined));
}

function lowerCaseKeys(headers: Record<string, string> = {}): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
}

function combineSignals(...signals: Array<AbortSignal | undefined>): AbortSignal | undefined {
  const defined = signals.filter((s): s is AbortSignal => s !== undefined);
  return defined.length > 1 ? AbortSignal.any(defined) : defined[0];
}

export function mergeRequestOptions(
  base: RequestOptions = {},
  override: RequestOptions = {},
): RequestOptions {
  const merged = { ...withoutUndefined(base), ...withoutUndefined(override) };
  if (base.headers || override.headers) {
    merged.headers = { ...lowerCaseKeys(base.headers), ...lowerCaseKeys(override.headers) };
  }
  const signal = combineSignals(base.signal, override.signal);
  if (signal) merged.signal = signal;
  return merged;
}

// ofetch ignores its own `timeout` when a signal is given and does not re-arm it on retries, so the timeout becomes a signal that bounds the whole call instead.
export function applyDeadline(options: RequestOptions = {}): RequestOptions {
  const { timeout, ...rest } = options;
  if (timeout === undefined) return rest;
  return { ...rest, signal: combineSignals(rest.signal, AbortSignal.timeout(timeout)) };
}

export function toFetchOptions(options: RequestOptions = {}): RequestFetchOptions {
  const { retry, retryDelay, headers, signal } = applyDeadline(options);
  const fetchOptions: RequestFetchOptions = {};
  if (retry !== undefined) fetchOptions.retry = retry;
  if (retryDelay !== undefined) fetchOptions.retryDelay = retryDelay;
  if (headers !== undefined) fetchOptions.headers = headers;
  if (signal !== undefined) fetchOptions.signal = signal;
  return fetchOptions;
}

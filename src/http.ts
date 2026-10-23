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

export function mergeRequestOptions(
  base: RequestOptions = {},
  override: RequestOptions = {},
): RequestOptions {
  return { ...base, ...override, headers: { ...base.headers, ...override.headers } };
}

export function toFetchOptions(options: RequestOptions = {}): RequestFetchOptions {
  const { retry, retryDelay, timeout, headers, signal } = options;
  const fetchOptions: RequestFetchOptions = {};
  if (retry !== undefined) fetchOptions.retry = retry;
  if (retryDelay !== undefined) fetchOptions.retryDelay = retryDelay;
  if (headers !== undefined) fetchOptions.headers = headers;

  // ofetch ignores its own `timeout` when a signal is given and does not re-arm it on retries,
  // so the timeout is enforced as a deadline for the whole call instead.
  const signals = [signal, timeout === undefined ? undefined : AbortSignal.timeout(timeout)].filter(
    (s): s is AbortSignal => s !== undefined,
  );
  if (signals.length > 0) {
    fetchOptions.signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals);
  }
  return fetchOptions;
}

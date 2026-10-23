import { afterEach, describe, expect, it, vi } from 'vitest';
import { http, mergeRequestOptions, toFetchOptions } from '../src/http.js';

describe('mergeRequestOptions', () => {
  it('lets the override win and merges headers', () => {
    const merged = mergeRequestOptions(
      { retry: 1, timeout: 1000, headers: { a: '1', b: '1' } },
      { retry: false, headers: { b: '2' } },
    );
    expect(merged).toEqual({ retry: false, timeout: 1000, headers: { a: '1', b: '2' } });
  });
});

describe('toFetchOptions', () => {
  it('omits options that were not given', () => {
    expect(toFetchOptions()).toEqual({});
  });

  it('turns timeout into a signal', () => {
    const { signal } = toFetchOptions({ timeout: 1000 });
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);
  });

  it('combines timeout with a caller signal', () => {
    const controller = new AbortController();
    const { signal } = toFetchOptions({ timeout: 60_000, signal: controller.signal });
    expect(signal).not.toBe(controller.signal);
    controller.abort();
    expect(signal?.aborted).toBe(true);
  });
});

describe('http', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries a POST only when retry is set', async () => {
    const fetchMock = vi.fn(async () => new Response('error', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(http('https://example.com', { method: 'POST', body: {} })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();
    await expect(
      http('https://example.com', { method: 'POST', body: {}, retry: 2 }),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry status codes outside the retry list', async () => {
    const fetchMock = vi.fn(async () => new Response('error', { status: 409 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      http('https://example.com', { method: 'POST', body: {}, retry: 2 }),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry once the signal is aborted', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(async () => {
      controller.abort();
      throw controller.signal.reason;
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      http('https://example.com', {
        method: 'POST',
        body: {},
        ...toFetchOptions({ retry: 2, signal: controller.signal }),
      }),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

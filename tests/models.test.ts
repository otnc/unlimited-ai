import { describe, expect, it, vi } from 'vitest';
import type * as HttpModule from '../src/http.js';

vi.mock('../src/http.js', async (importOriginal) => ({
  ...(await importOriginal<typeof HttpModule>()),
  http: vi.fn(async () => ({
    object: 'list',
    data: [
      { id: 'gpt-4', object: 'model', owned_by: 'openai' },
      { id: 'gemini-1.5-flash', object: 'model', owned_by: 'google' },
    ],
  })),
}));

import { models } from '../src/models.js';
import { http } from '../src/http.js';

describe('models', () => {
  it('returns array of model id strings', async () => {
    const result = await models();
    expect(result).toEqual(['gpt-4', 'gemini-1.5-flash']);
  });

  it('returns an array', async () => {
    const result = await models();
    expect(Array.isArray(result)).toBe(true);
  });

  it('passes request options through', async () => {
    await models({ retry: false });
    expect(vi.mocked(http)).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({ retry: false }),
    );
  });
});

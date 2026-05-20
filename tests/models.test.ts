import { describe, expect, it, vi } from 'vitest';

vi.mock('ky', () => ({
  default: {
    get: vi.fn(() => ({
      json: vi.fn(async () => ({
        object: 'list',
        data: [
          { id: 'gpt-4', object: 'model', owned_by: 'openai' },
          { id: 'gemini-1.5-flash', object: 'model', owned_by: 'google' },
        ],
      })),
    })),
  },
}));

import { models } from '../src/models.js';

describe('models', () => {
  it('returns array of model id strings', async () => {
    const result = await models();
    expect(result).toEqual(['gpt-4', 'gemini-1.5-flash']);
  });

  it('returns an array', async () => {
    const result = await models();
    expect(Array.isArray(result)).toBe(true);
  });
});

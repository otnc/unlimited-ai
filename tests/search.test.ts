import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/models.js', () => ({
  models: vi.fn(async () => ['gpt-4', 'gpt-4-turbo', 'gemini-1.5-flash']),
}));

vi.mock('closewords', () => ({
  closeWords: vi.fn(async () => ['gpt-4', 'gpt-4-turbo']),
}));

import { searchModels } from '../src/search.js';

describe('searchModels', () => {
  it('returns an array of strings', async () => {
    const result = await searchModels('gpt');
    expect(Array.isArray(result)).toBe(true);
    result.forEach((m) => expect(typeof m).toBe('string'));
  });

  it('throws TypeError for non-string word', async () => {
    await expect(searchModels(123 as never)).rejects.toThrow(TypeError);
  });
});

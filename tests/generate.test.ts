import { describe, expect, it, vi } from 'vitest';

vi.mock('ky', () => ({
  default: {
    post: vi.fn(() => ({
      json: vi.fn(async () => ({
        id: 'chatcmpl-test',
        object: 'chat.completion',
        created: 0,
        model: 'gpt-4',
        choices: [{ index: 0, message: { role: 'assistant', content: 'Hello!' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      })),
    })),
  },
}));

import { generate } from '../src/generate.js';

describe('generate', () => {
  it('returns content string by default', async () => {
    const result = await generate('gpt-4', [{ role: 'user', content: 'hi' }]);
    expect(result).toBe('Hello!');
  });

  it('returns raw response object when raw=true', async () => {
    const result = await generate('gpt-4', [{ role: 'user', content: 'hi' }], true);
    expect(result).toHaveProperty('choices');
    expect(result).toHaveProperty('model', 'gpt-4');
  });

  it('throws TypeError for empty model', async () => {
    await expect(generate('', [{ role: 'user', content: 'hi' }])).rejects.toThrow(TypeError);
  });

  it('throws TypeError for invalid messages', async () => {
    await expect(
      generate('gpt-4', [{ role: 'invalid' as never, content: 'hi' }]),
    ).rejects.toThrow(TypeError);
  });
});

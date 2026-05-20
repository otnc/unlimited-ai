import { describe, expect, it, vi } from 'vitest';

const mockCompletion = {
  id: 'chatcmpl-test',
  object: 'chat.completion',
  created: 0,
  model: 'gpt-4',
  choices: [{ index: 0, message: { role: 'assistant', content: 'Hello!' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
};

vi.mock('ky', () => ({
  default: {
    post: vi.fn(() => ({
      json: vi.fn(async () => mockCompletion),
    })),
  },
}));

import { generate, stream, ask } from '../src/generate.js';
import ky from 'ky';

function createSSEStream(contents: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const content of contents) {
        const chunk = JSON.stringify({
          id: 'chatcmpl-test',
          object: 'chat.completion.chunk',
          created: 0,
          model: 'gpt-4',
          choices: [{ index: 0, delta: { content }, finish_reason: null }],
        });
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

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
    await expect(generate('gpt-4', [{ role: 'invalid' as never, content: 'hi' }])).rejects.toThrow(
      TypeError,
    );
  });
});

describe('ask', () => {
  it('returns reply string', async () => {
    const result = await ask('gpt-4', 'Hello!');
    expect(result).toBe('Hello!');
  });

  it('includes system message when provided', async () => {
    await ask('gpt-4', 'Hello!', 'You are a bot.');
    expect(vi.mocked(ky.post)).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        json: expect.objectContaining({
          messages: expect.arrayContaining([{ role: 'system', content: 'You are a bot.' }]),
        }),
      }),
    );
  });

  it('throws TypeError for empty model', async () => {
    await expect(ask('', 'Hello!')).rejects.toThrow(TypeError);
  });
});

describe('stream', () => {
  it('yields content chunks from SSE', async () => {
    const body = createSSEStream(['Hello', '!']);
    vi.mocked(ky.post).mockReturnValueOnce({ body } as never);

    const chunks: string[] = [];
    for await (const chunk of stream('gpt-4', [{ role: 'user', content: 'hi' }])) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(['Hello', '!']);
  });

  it('throws TypeError for empty model', async () => {
    const gen = stream('', [{ role: 'user', content: 'hi' }]);
    await expect(gen.next()).rejects.toThrow(TypeError);
  });
});

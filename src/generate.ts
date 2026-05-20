import ky from 'ky';
import { config } from './config.js';
import { validateMessages } from './utils.js';
import type { CompletionResponse, Message, StreamChunk } from './types.js';

export async function generate(
  model: string,
  messages: Message[],
  raw: true,
): Promise<CompletionResponse>;
export async function generate(model: string, messages: Message[], raw?: false): Promise<string>;
export async function generate(
  model: string,
  messages: Message[],
  raw = false,
): Promise<string | CompletionResponse> {
  if (typeof model !== 'string' || model.length === 0) {
    throw new TypeError('model must be a non-empty string.');
  }
  validateMessages(messages);

  const data = await ky
    .post(config.API_URL, { json: { model, messages } })
    .json<CompletionResponse>();
  return raw ? data : (data.choices[0]?.message.content ?? '');
}

export async function* stream(model: string, messages: Message[]): AsyncGenerator<string> {
  if (typeof model !== 'string' || model.length === 0) {
    throw new TypeError('model must be a non-empty string.');
  }
  validateMessages(messages);

  const response = await ky.post(config.API_URL, {
    json: { model, messages, stream: true },
    timeout: false,
  });

  const { body } = response;
  if (!body) throw new Error('Response body is null.');

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trimEnd();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const chunk = JSON.parse(data) as StreamChunk;
          const content = chunk.choices[0]?.delta.content;
          if (content) yield content;
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function ask(model: string, prompt: string, system?: string): Promise<string> {
  const messages: Message[] = [];
  if (system !== undefined) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });
  return generate(model, messages);
}

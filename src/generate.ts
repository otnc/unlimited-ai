import ky from 'ky';
import { config } from './config.js';
import { validateMessages } from './utils.js';
import type { CompletionResponse, Message } from './types.js';

export async function generate(model: string, messages: Message[], raw: true): Promise<CompletionResponse>;
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

  const data = await ky.post(config.API_URL, { json: { model, messages } }).json<CompletionResponse>();
  return raw ? data : (data.choices[0]?.message.content ?? '');
}

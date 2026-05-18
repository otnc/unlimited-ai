import type { Message } from './types.js';

const VALID_ROLES = new Set<string>(['system', 'user', 'assistant']);

export function isValidMessage(msg: unknown): msg is Message {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'role' in msg &&
    'content' in msg &&
    VALID_ROLES.has((msg as Record<string, unknown>)['role'] as string) &&
    typeof (msg as Record<string, unknown>)['content'] === 'string'
  );
}

export function validateMessage(message: unknown): asserts message is Message {
  if (!isValidMessage(message)) {
    throw new TypeError("message must be { role: 'system'|'user'|'assistant', content: string }.");
  }
}

export function validateMessages(messages: unknown): asserts messages is Message[] {
  if (!Array.isArray(messages) || !messages.every(isValidMessage)) {
    throw new TypeError(
      "messages must be an array of { role: 'system'|'user'|'assistant', content: string }.",
    );
  }
}

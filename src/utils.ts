import type { Message, RequestOptions } from './types.js';

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

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

export function validateRequestOptions(
  options: unknown,
): asserts options is RequestOptions | undefined {
  if (options === undefined) return;
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('options must be an object.');
  }
  const { retry, retryDelay, timeout, headers, signal } = options as Record<string, unknown>;
  if (retry !== undefined && retry !== false && !isNonNegativeInteger(retry)) {
    throw new TypeError('options.retry must be a non-negative integer or false.');
  }
  if (retryDelay !== undefined && !isNonNegativeInteger(retryDelay)) {
    throw new TypeError('options.retryDelay must be a non-negative integer.');
  }
  if (timeout !== undefined && !(isNonNegativeInteger(timeout) && timeout > 0)) {
    throw new TypeError('options.timeout must be a positive integer.');
  }
  if (
    headers !== undefined &&
    (typeof headers !== 'object' ||
      headers === null ||
      !Object.values(headers).every((v) => typeof v === 'string'))
  ) {
    throw new TypeError('options.headers must be an object of string values.');
  }
  if (signal !== undefined && !(signal instanceof AbortSignal)) {
    throw new TypeError('options.signal must be an AbortSignal.');
  }
}

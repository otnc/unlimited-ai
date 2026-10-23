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

// Longer delays overflow Node's timers, which then fire immediately.
const MAX_TIMEOUT = 2 ** 31 - 1;

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
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
  if (
    timeout !== undefined &&
    !(isNonNegativeInteger(timeout) && timeout > 0 && timeout <= MAX_TIMEOUT)
  ) {
    throw new TypeError(`options.timeout must be a positive integer up to ${MAX_TIMEOUT}.`);
  }
  if (
    headers !== undefined &&
    (!isPlainObject(headers) || !Object.values(headers).every((v) => typeof v === 'string'))
  ) {
    throw new TypeError('options.headers must be an object of string values.');
  }
  if (signal !== undefined && !(signal instanceof AbortSignal)) {
    throw new TypeError('options.signal must be an AbortSignal.');
  }
}

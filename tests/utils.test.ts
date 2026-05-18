import { describe, expect, it } from 'vitest';
import { isValidMessage, validateMessage, validateMessages } from '../src/utils.js';

describe('isValidMessage', () => {
  it('accepts all valid roles', () => {
    expect(isValidMessage({ role: 'user', content: 'hello' })).toBe(true);
    expect(isValidMessage({ role: 'system', content: '' })).toBe(true);
    expect(isValidMessage({ role: 'assistant', content: 'hi' })).toBe(true);
  });

  it('rejects invalid role', () => {
    expect(isValidMessage({ role: 'invalid', content: 'hi' })).toBe(false);
  });

  it('rejects non-string content', () => {
    expect(isValidMessage({ role: 'user', content: 123 })).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(isValidMessage({ role: 'user' })).toBe(false);
    expect(isValidMessage({ content: 'hi' })).toBe(false);
  });

  it('rejects null and primitives', () => {
    expect(isValidMessage(null)).toBe(false);
    expect(isValidMessage('string')).toBe(false);
    expect(isValidMessage(42)).toBe(false);
  });
});

describe('validateMessage', () => {
  it('does not throw for valid message', () => {
    expect(() => validateMessage({ role: 'user', content: 'hi' })).not.toThrow();
  });

  it('throws TypeError for invalid message', () => {
    expect(() => validateMessage({ role: 'bad', content: 'x' })).toThrow(TypeError);
    expect(() => validateMessage(null)).toThrow(TypeError);
  });
});

describe('validateMessages', () => {
  it('accepts empty array', () => {
    expect(() => validateMessages([])).not.toThrow();
  });

  it('accepts valid array', () => {
    expect(() => validateMessages([{ role: 'user', content: 'hi' }])).not.toThrow();
  });

  it('throws TypeError for non-array', () => {
    expect(() => validateMessages('not an array')).toThrow(TypeError);
  });

  it('throws TypeError for array with invalid item', () => {
    expect(() => validateMessages([{ role: 'bad', content: 'hi' }])).toThrow(TypeError);
  });
});

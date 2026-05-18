import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/generate.js', () => ({
  generate: vi.fn(async () => 'Hello!'),
}));

vi.mock('../src/search.js', () => ({
  searchModels: vi.fn(async () => ['gpt-4-turbo']),
}));

import { AI } from '../src/client.js';
import { searchModels } from '../src/search.js';

describe('AI', () => {
  it('chains setModel + addMessage + generate', async () => {
    const result = await new AI()
      .setModel('gpt-4')
      .addMessage({ role: 'user', content: 'hi' })
      .generate();
    expect(result).toBe('Hello!');
  });

  it('accepts initial model and messages in constructor', () => {
    const ai = new AI({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'hi' }],
    });
    expect(ai.getFormat().model).toBe('gpt-4');
    expect(ai.getFormat().messages).toHaveLength(1);
  });

  it('throws if model not set before generate', async () => {
    const ai = new AI().addMessage({ role: 'user', content: 'hi' });
    await expect(ai.generate()).rejects.toThrow('model is not set');
  });

  it('throws if messages empty before generate', async () => {
    await expect(new AI().setModel('gpt-4').generate()).rejects.toThrow('messages are empty');
  });

  it('removes message by index', () => {
    const ai = new AI()
      .setModel('gpt-4')
      .addMessage({ role: 'user', content: 'a' })
      .addMessage({ role: 'user', content: 'b' });
    ai.removeMessage(0);
    const { messages } = ai.getFormat();
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content).toBe('b');
  });

  it('throws RangeError for out-of-bounds removeMessage', () => {
    const ai = new AI().setModel('gpt-4').addMessage({ role: 'user', content: 'a' });
    expect(() => ai.removeMessage(5)).toThrow(RangeError);
  });

  it('uses fuzzy search when enabled', async () => {
    await new AI()
      .setModel('gpt', true)
      .addMessage({ role: 'user', content: 'hi' })
      .generate();
    expect(searchModels).toHaveBeenCalledWith('gpt');
  });

  it('replaces messages with setMessages', () => {
    const ai = new AI()
      .setModel('gpt-4')
      .addMessage({ role: 'user', content: 'a' })
      .setMessages([{ role: 'assistant', content: 'b' }]);
    expect(ai.getFormat().messages).toHaveLength(1);
    expect(ai.getFormat().messages[0]?.content).toBe('b');
  });

  it('getFormat returns copies, not references', () => {
    const ai = new AI().setModel('gpt-4').addMessage({ role: 'user', content: 'a' });
    const fmt = ai.getFormat();
    fmt.messages.push({ role: 'user', content: 'injected' });
    expect(ai.getFormat().messages).toHaveLength(1);
  });
});

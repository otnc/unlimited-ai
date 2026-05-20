import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/generate.js', () => ({
  generate: vi.fn(async () => 'Hello!'),
  stream: vi.fn(async function* () {
    yield 'Hello';
    yield '!';
  }),
}));

vi.mock('../src/search.js', () => ({
  searchModels: vi.fn(async () => ['gpt-4-turbo']),
}));

import { AI } from '../src/client.js';
import { searchModels } from '../src/search.js';

describe('AI — core', () => {
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

  it('accepts system option in constructor', () => {
    const ai = new AI({ model: 'gpt-4', system: 'You are helpful.' });
    const { messages } = ai.getFormat();
    expect(messages[0]?.role).toBe('system');
    expect(messages[0]?.content).toBe('You are helpful.');
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
    await new AI().setModel('gpt', true).addMessage({ role: 'user', content: 'hi' }).generate();
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

  it('clearMessages removes all messages', () => {
    const ai = new AI()
      .setModel('gpt-4')
      .addMessage({ role: 'user', content: 'hi' })
      .clearMessages();
    expect(ai.getFormat().messages).toHaveLength(0);
  });

  it('setSystem prepends system message', () => {
    const ai = new AI()
      .setModel('gpt-4')
      .addMessage({ role: 'user', content: 'hello' })
      .setSystem('You are a bot.');
    const { messages } = ai.getFormat();
    expect(messages[0]?.role).toBe('system');
    expect(messages[0]?.content).toBe('You are a bot.');
    expect(messages).toHaveLength(2);
  });

  it('setSystem replaces existing system message', () => {
    const ai = new AI().setModel('gpt-4').setSystem('First').setSystem('Second');
    const { messages } = ai.getFormat();
    expect(messages.filter((m) => m.role === 'system')).toHaveLength(1);
    expect(messages[0]?.content).toBe('Second');
  });
});

describe('AI — ask (stateless)', () => {
  it('returns reply without modifying this.messages', async () => {
    const ai = new AI().setModel('gpt-4');
    const reply = await ai.ask('hello');
    expect(reply).toBe('Hello!');
    expect(ai.getFormat().messages).toHaveLength(0);
  });

  it('includes static context (this.messages) in the request', async () => {
    const { generate } = await import('../src/generate.js');
    const ai = new AI({ model: 'gpt-4', system: 'You are helpful.' });
    await ai.ask('hello');
    expect(vi.mocked(generate)).toHaveBeenCalledWith(
      'gpt-4',
      expect.arrayContaining([{ role: 'system', content: 'You are helpful.' }]),
    );
  });

  it('throws if model not set', async () => {
    await expect(new AI().ask('hello')).rejects.toThrow('model is not set');
  });
});

describe('AI — ask (conversation)', () => {
  it('saves user + assistant messages to conversation', async () => {
    const ai = new AI().setModel('gpt-4');
    const reply = await ai.ask('hello', 'conv-1');
    expect(reply).toBe('Hello!');
    const msgs = ai.getConversationMessages('conv-1');
    expect(msgs).toHaveLength(2);
    expect(msgs[0]?.role).toBe('user');
    expect(msgs[1]?.role).toBe('assistant');
    expect(msgs[1]?.content).toBe('Hello!');
  });

  it('accumulates history across multiple asks', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('first', 'conv-1');
    await ai.ask('second', 'conv-1');
    expect(ai.getConversationMessages('conv-1')).toHaveLength(4);
  });

  it('useConversation routes subsequent asks to that conversation', async () => {
    const ai = new AI().setModel('gpt-4').useConversation('conv-1');
    await ai.ask('hello');
    expect(ai.getConversationMessages('conv-1')).toHaveLength(2);
  });

  it('inline id overrides useConversation for that call', async () => {
    const ai = new AI().setModel('gpt-4').useConversation('conv-A');
    await ai.ask('hello', 'conv-B');
    expect(ai.getConversationMessages('conv-B')).toHaveLength(2);
    expect(ai.getConversationMessages('conv-A')).toHaveLength(0);
  });

  it('different conversation IDs maintain separate histories', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('msg-a', 'conv-a');
    await ai.ask('msg-b', 'conv-b');
    expect(ai.getConversationMessages('conv-a')).toHaveLength(2);
    expect(ai.getConversationMessages('conv-b')).toHaveLength(2);
  });
});

describe('AI — stream (stateless)', () => {
  it('yields chunks without modifying this.messages', async () => {
    const ai = new AI().setModel('gpt-4');
    const chunks: string[] = [];
    for await (const chunk of ai.stream('hello')) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(['Hello', '!']);
    expect(ai.getFormat().messages).toHaveLength(0);
  });

  it('throws if model not set', async () => {
    const gen = new AI().stream('hello');
    await expect(gen.next()).rejects.toThrow('model is not set');
  });
});

describe('AI — stream (conversation)', () => {
  it('saves user + assembled reply to conversation', async () => {
    const ai = new AI().setModel('gpt-4');
    for await (const _chunk of ai.stream('hello', 'conv-1')) {
      // consume
    }
    const msgs = ai.getConversationMessages('conv-1');
    expect(msgs).toHaveLength(2);
    expect(msgs[0]?.role).toBe('user');
    expect(msgs[1]?.role).toBe('assistant');
    expect(msgs[1]?.content).toBe('Hello!');
  });
});

describe('AI — conversation management', () => {
  it('listConversations returns all conversation IDs', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('a', 'conv-1');
    await ai.ask('b', 'conv-2');
    expect(ai.listConversations()).toContain('conv-1');
    expect(ai.listConversations()).toContain('conv-2');
  });

  it('clearConversation empties the history', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('hello', 'conv-1');
    ai.clearConversation('conv-1');
    expect(ai.getConversationMessages('conv-1')).toHaveLength(0);
  });

  it('deleteConversation removes the conversation', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('hello', 'conv-1');
    ai.deleteConversation('conv-1');
    expect(ai.listConversations()).not.toContain('conv-1');
  });

  it('getConversationMessages returns a copy', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('hello', 'conv-1');
    const msgs = ai.getConversationMessages('conv-1');
    msgs.push({ role: 'user', content: 'injected' });
    expect(ai.getConversationMessages('conv-1')).toHaveLength(2);
  });

  it('useConversation(null) reverts to stateless', async () => {
    const ai = new AI().setModel('gpt-4').useConversation('conv-1');
    ai.useConversation(null);
    await ai.ask('hello');
    expect(ai.getConversationMessages('conv-1')).toHaveLength(0);
  });

  it('exportConversations(id) returns a copy of that conversation only', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('hello', 'conv-1');
    await ai.ask('hi', 'conv-2');
    const msgs = ai.exportConversations('conv-1');
    expect(msgs).toHaveLength(2);
    expect(msgs[0]?.role).toBe('user');
    // must be a copy
    msgs.push({ role: 'user', content: 'injected' });
    expect(ai.getConversationMessages('conv-1')).toHaveLength(2);
  });

  it('exportConversations(id) returns empty array for unknown id', async () => {
    const ai = new AI().setModel('gpt-4');
    expect(ai.exportConversations('unknown')).toEqual([]);
  });

  it('exportConversations returns a plain object copy of all conversations', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('hello', 'conv-1');
    await ai.ask('hi', 'conv-2');
    const exported = ai.exportConversations();
    expect(Object.keys(exported)).toContain('conv-1');
    expect(Object.keys(exported)).toContain('conv-2');
    expect(exported['conv-1']).toHaveLength(2);
    // must be a copy
    exported['conv-1']!.push({ role: 'user', content: 'injected' });
    expect(ai.getConversationMessages('conv-1')).toHaveLength(2);
  });

  it('importConversations merges by default', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('hello', 'conv-1');
    ai.importConversations({ 'conv-2': [{ role: 'user', content: 'hi' }] });
    expect(ai.listConversations()).toContain('conv-1');
    expect(ai.listConversations()).toContain('conv-2');
  });

  it('importConversations with replace=true clears existing conversations', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('hello', 'conv-1');
    ai.importConversations({ 'conv-2': [{ role: 'user', content: 'hi' }] }, true);
    expect(ai.listConversations()).not.toContain('conv-1');
    expect(ai.listConversations()).toContain('conv-2');
  });

  it('round-trips through JSON', async () => {
    const ai = new AI().setModel('gpt-4');
    await ai.ask('hello', 'conv-1');
    const json = JSON.stringify(ai.exportConversations());

    const ai2 = new AI().setModel('gpt-4');
    ai2.importConversations(JSON.parse(json));
    expect(ai2.getConversationMessages('conv-1')).toHaveLength(2);
  });
});

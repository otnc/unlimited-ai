import { generate, stream as streamRequest } from './generate.js';
import { searchModels } from './search.js';
import { validateMessage, validateMessages } from './utils.js';
import type { CompletionResponse, ConversationStore, Message } from './types.js';

export class AI {
  private model = '';
  private messages: Message[] = [];
  private useSearch = false;
  private conversationMap = new Map<string, Message[]>();
  private activeConversationId: string | null = null;

  constructor(init?: { model?: string; messages?: Message[]; system?: string }) {
    if (init?.model !== undefined) {
      if (typeof init.model !== 'string' || init.model.length === 0) {
        throw new TypeError('model must be a non-empty string.');
      }
      this.model = init.model;
    }
    if (init?.messages !== undefined) {
      validateMessages(init.messages);
      this.messages = [...init.messages];
    }
    if (init?.system !== undefined) {
      if (typeof init.system !== 'string') throw new TypeError('system must be a string.');
      this.messages.unshift({ role: 'system', content: init.system });
    }
  }

  setModel(model: string, search = false): this {
    if (typeof model !== 'string' || model.length === 0) {
      throw new TypeError('model must be a non-empty string.');
    }
    this.model = model;
    this.useSearch = search;
    return this;
  }

  setMessages(messages: Message[]): this {
    validateMessages(messages);
    this.messages = [...messages];
    return this;
  }

  addMessage(message: Message): this {
    validateMessage(message);
    this.messages.push(message);
    return this;
  }

  removeMessage(index: number): this {
    if (!Number.isInteger(index)) throw new TypeError('index must be an integer.');
    if (index < 0 || index >= this.messages.length) {
      throw new RangeError(`index out of bounds. Valid range: 0 to ${this.messages.length - 1}.`);
    }
    this.messages.splice(index, 1);
    return this;
  }

  clearMessages(): this {
    this.messages = [];
    return this;
  }

  setSystem(content: string): this {
    if (typeof content !== 'string') throw new TypeError('content must be a string.');
    const idx = this.messages.findIndex((m) => m.role === 'system');
    if (idx !== -1) {
      this.messages.splice(idx, 1);
    }
    this.messages.unshift({ role: 'system', content });
    return this;
  }

  // --- Conversation management ---

  useConversation(id: string | null): this {
    if (id !== null && (typeof id !== 'string' || id.length === 0)) {
      throw new TypeError('id must be a non-empty string.');
    }
    this.activeConversationId = id;
    if (id !== null && !this.conversationMap.has(id)) {
      this.conversationMap.set(id, []);
    }
    return this;
  }

  listConversations(): string[] {
    return [...this.conversationMap.keys()];
  }

  getConversationMessages(id: string): Message[] {
    return [...(this.conversationMap.get(id) ?? [])];
  }

  clearConversation(id: string): this {
    if (this.conversationMap.has(id)) {
      this.conversationMap.set(id, []);
    }
    return this;
  }

  deleteConversation(id: string): this {
    this.conversationMap.delete(id);
    return this;
  }

  exportConversations(id: string): Message[];
  exportConversations(): ConversationStore;
  exportConversations(id?: string): ConversationStore | Message[] {
    if (id !== undefined) {
      return [...(this.conversationMap.get(id) ?? [])];
    }
    const result: ConversationStore = {};
    for (const [key, messages] of this.conversationMap) {
      result[key] = [...messages];
    }
    return result;
  }

  importConversations(data: ConversationStore, replace = false): this {
    if (replace) this.conversationMap.clear();
    for (const [id, messages] of Object.entries(data)) {
      validateMessages(messages);
      this.conversationMap.set(id, [...messages]);
    }
    return this;
  }

  // --- Core ---

  async generate(raw: true): Promise<CompletionResponse>;
  async generate(raw?: false): Promise<string>;
  async generate(raw?: boolean): Promise<string | CompletionResponse> {
    if (!this.model) throw new Error('model is not set. Call setModel() first.');
    if (this.messages.length === 0) {
      throw new Error('messages are empty. Call addMessage() or setMessages() first.');
    }
    const model = this.useSearch ? ((await searchModels(this.model))[0] ?? this.model) : this.model;
    if (raw) return generate(model, this.messages, true);
    return generate(model, this.messages);
  }

  async ask(prompt: string, conversationId?: string): Promise<string> {
    if (typeof prompt !== 'string') throw new TypeError('prompt must be a string.');
    if (!this.model) throw new Error('model is not set. Call setModel() first.');

    const id = conversationId ?? this.activeConversationId;
    const model = this.useSearch ? ((await searchModels(this.model))[0] ?? this.model) : this.model;

    if (id !== null) {
      if (!this.conversationMap.has(id)) this.conversationMap.set(id, []);
      const history = this.conversationMap.get(id)!;
      history.push({ role: 'user', content: prompt });
      const reply = await generate(model, [...this.messages, ...history]);
      history.push({ role: 'assistant', content: reply });
      return reply;
    }

    // Stateless: use static context + prompt, save nothing
    return generate(model, [...this.messages, { role: 'user', content: prompt }]);
  }

  async *stream(prompt: string, conversationId?: string): AsyncGenerator<string> {
    if (typeof prompt !== 'string') throw new TypeError('prompt must be a string.');
    if (!this.model) throw new Error('model is not set. Call setModel() first.');

    const id = conversationId ?? this.activeConversationId;
    const model = this.useSearch ? ((await searchModels(this.model))[0] ?? this.model) : this.model;

    if (id !== null) {
      if (!this.conversationMap.has(id)) this.conversationMap.set(id, []);
      const history = this.conversationMap.get(id)!;
      history.push({ role: 'user', content: prompt });
      let fullReply = '';
      for await (const chunk of streamRequest(model, [...this.messages, ...history])) {
        fullReply += chunk;
        yield chunk;
      }
      history.push({ role: 'assistant', content: fullReply });
    } else {
      // Stateless: use static context + prompt, save nothing
      for await (const chunk of streamRequest(model, [
        ...this.messages,
        { role: 'user', content: prompt },
      ])) {
        yield chunk;
      }
    }
  }

  getFormat(): { model: string; messages: Message[] } {
    return { model: this.model, messages: [...this.messages] };
  }
}

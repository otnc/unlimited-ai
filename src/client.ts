import { generate } from './generate.js';
import { searchModels } from './search.js';
import { validateMessage, validateMessages } from './utils.js';
import type { CompletionResponse, Message } from './types.js';

export class AI {
  private model = '';
  private messages: Message[] = [];
  private useSearch = false;

  constructor(init?: { model?: string; messages?: Message[] }) {
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
  }

  /**
   * Set the model. Pass `search: true` to fuzzy-match the name before each generation.
   */
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

  async generate(raw: true): Promise<CompletionResponse>;
  async generate(raw?: false): Promise<string>;
  async generate(raw?: boolean): Promise<string | CompletionResponse> {
    if (!this.model) throw new Error('model is not set. Call setModel() first.');
    if (this.messages.length === 0) {
      throw new Error('messages are empty. Call addMessage() or setMessages() first.');
    }
    const model = this.useSearch
      ? ((await searchModels(this.model))[0] ?? this.model)
      : this.model;
    if (raw) return generate(model, this.messages, true);
    return generate(model, this.messages);
  }

  getFormat(): { model: string; messages: Message[] } {
    return { model: this.model, messages: [...this.messages] };
  }
}

# unlimited-ai

**English** | [日本語](README-ja.md)

Fast, minimal Node.js wrapper for the [Voids API](https://voids.top/) AI chat completions.

> [!Note]
> The Voids API is not affiliated with this package. For API issues, do not open GitHub issues here.

```sh
npm install unlimited-ai
```

## unlimited-ai is back!

Rewritten in TypeScript. `axios` replaced with `ky`.  
Conversation history is now supported via conversation IDs — previously, every call was stateless.

<details>

<summary>See other changes...</summary>

`allModels()` renamed to `models()`. Curated model list removed. `searchModels()` no longer takes an `all` parameter.

</details>

> [!Caution]
>
> v6.x and below are no longer supported.  
> Some functions no longer work or have changed. Please update to v7 or later.

---

## Quick start

```ts
import { AI } from 'unlimited-ai';

const ai = new AI({ model: 'gpt-4o', system: 'You are a helpful assistant.' });
console.log(await ai.ask('Hello!'));
```

Or with the functional API:

```ts
import { generate, ask, models } from 'unlimited-ai';

const list = await models();
console.log(list); // ['gpt-4o', 'gemini-1.5-flash', ...]

const reply = await generate('gpt-4o', [{ role: 'user', content: 'Hello!' }]);
console.log(reply);
```

---

## `new AI(init?)`

```ts
new AI(init?: {
  model?: string;
  system?: string;
  messages?: Message[];
})
```

Creates a new AI instance.

**`init.model`** `string` *(optional)*  
Model ID to use (e.g. `'gpt-4o'`).

**`init.system`** `string` *(optional)*  
System prompt. Prepended to every request as a `system` message.

**`init.messages`** `Message[]` *(optional)*  
Initial static context. These messages are prepended to every request.

---

### Static context

Static context messages are prepended to every request. Useful for system prompts and few-shot examples. All methods return `this` and are chainable.

---

#### `setModel(model, search?)`

```ts
setModel(model: string, search?: boolean): this
```

Sets the model for subsequent requests.

**`model`** `string`  
Model ID (e.g. `'gpt-4o'`).

**`search`** `boolean` *(optional, default: `false`)*  
When `true`, runs a fuzzy search via `searchModels` and uses the closest matching model ID.

---

#### `setSystem(content)`

```ts
setSystem(content: string): this
```

Sets or replaces the system prompt. If a `system` message already exists in the static context, it is replaced in-place; otherwise one is prepended.

**`content`** `string`  
System prompt text.

---

#### `setMessages(messages)`

```ts
setMessages(messages: Message[]): this
```

Replaces the entire static context array.

**`messages`** `Message[]`  
New static context. Overwrites the previous value entirely.

---

#### `addMessage(message)`

```ts
addMessage(message: Message): this
```

Appends a single message to the static context.

**`message`** `Message`  
Message to append (`{ role, content }`).

---

#### `removeMessage(index)`

```ts
removeMessage(index: number): this
```

Removes a message from the static context by index. Throws `RangeError` if the index is out of bounds.

**`index`** `number`  
Zero-based index of the message to remove.

---

#### `clearMessages()`

```ts
clearMessages(): this
```

Removes all messages from the static context.

---

#### `getFormat()`

```ts
getFormat(): { model: string; messages: Message[] }
```

Returns a snapshot of the current model and static context. The returned `messages` array is a shallow copy — mutating it does not affect the instance.

---

#### `generate(raw?)`

```ts
generate(raw?: false): Promise<string>
generate(raw: true): Promise<CompletionResponse>
```

Sends the current static context (`this.messages`) as-is and returns the reply.

**`raw`** `boolean` *(optional, default: `false`)*  
When `true`, returns the full `CompletionResponse` object instead of just the reply string.

---

### Conversations

Per-conversation history is managed automatically and kept separate from the static context. All methods return `this` and are chainable unless noted otherwise.

---

#### `useConversation(id)`

```ts
useConversation(id: string | null): this
```

Sets the active conversation for subsequent `ask` and `stream` calls. Pass `null` to return to stateless mode.

**`id`** `string | null`  
Conversation ID to activate. Any non-empty string is valid (UUID, snowflake, username, etc.). When a new ID is used, an empty history is created automatically.

---

#### `ask(prompt, id?)`

```ts
ask(prompt: string, id?: string): Promise<string>
```

Sends a message and returns the reply.

- If `id` is provided, or an active conversation is set via `useConversation`, the user message and reply are appended to that conversation's history.
- If no ID is active, the call is stateless — only the static context and this prompt are sent, and nothing is saved.

**`prompt`** `string`  
The user message to send.

**`id`** `string` *(optional)*  
Conversation ID. Overrides the active conversation set by `useConversation` for this call only.

**Returns** `Promise<string>`  
The assistant's reply.

---

#### `stream(prompt, id?)`

```ts
stream(prompt: string, id?: string): AsyncGenerator<string>
```

Same as `ask`, but yields the reply as chunks as they arrive. After the generator is exhausted, the full assembled reply is saved to the conversation history (if an ID is active).

**`prompt`** `string`  
The user message to send.

**`id`** `string` *(optional)*  
Conversation ID. Overrides the active conversation for this call only.

**Yields** `string`  
Successive text chunks of the reply.

---

#### `listConversations()`

```ts
listConversations(): string[]
```

Returns an array of all known conversation IDs.

---

#### `getConversationMessages(id)`

```ts
getConversationMessages(id: string): Message[]
```

Returns a copy of the message history for the given conversation. Mutating the returned array does not affect the stored history.

**`id`** `string`  
Conversation ID.

---

#### `clearConversation(id)`

```ts
clearConversation(id): this
```

Empties the message history for the given conversation without removing the conversation itself.

**`id`** `string`  
Conversation ID.

---

#### `deleteConversation(id)`

```ts
deleteConversation(id: string): this
```

Removes the conversation and its history entirely.

**`id`** `string`  
Conversation ID.

---

#### `exportConversations(id?)`

```ts
exportConversations(id: string): Message[]
exportConversations(): ConversationStore
```

Exports conversation history as a plain, JSON-serializable value.

- When `id` is provided, returns a copy of that conversation's `Message[]`.
- When called without arguments, returns a `ConversationStore` (a plain object keyed by conversation ID) containing copies of all conversations.

**`id`** `string` *(optional)*  
Conversation ID. When omitted, all conversations are exported.

---

#### `importConversations(data, replace?)`

```ts
importConversations(data: ConversationStore, replace?: boolean): this
```

Loads conversations from a plain object (e.g. parsed from JSON). Useful for restoring history after a restart.

**`data`** `ConversationStore`  
Plain object mapping conversation IDs to `Message[]` arrays.

**`replace`** `boolean` *(optional, default: `false`)*  
When `false` (default), incoming conversations are merged with existing ones. When `true`, all existing conversations are cleared before importing.

---

### Examples

**Multi-turn with `useConversation`**

```ts
import { AI } from 'unlimited-ai';

const ai = new AI({ model: 'gpt-4o', system: 'You are a helpful assistant.' });

ai.useConversation('session-1');
console.log(await ai.ask('What is TypeScript?'));
console.log(await ai.ask('What about its type system?')); // full history sent
```

**Per-user histories (inline IDs)**

```ts
import { AI } from 'unlimited-ai';

const ai = new AI({ model: 'gpt-4o', system: 'You are a helpful assistant.' });

await ai.ask('Hello!', 'user-alice');
await ai.ask('Hi there!', 'user-bob');
await ai.ask('Remember me?', 'user-alice'); // alice's history is restored
```

**Stateless**

```ts
const reply = await ai.ask('What is 2 + 2?');
// Sends static context + this prompt only. Nothing is saved.
```

**Streaming**

```ts
import { AI } from 'unlimited-ai';

const ai = new AI({ model: 'gpt-4o' });

ai.useConversation('session-1');
for await (const chunk of ai.stream('Tell me a joke.')) {
  process.stdout.write(chunk);
}
// The full reply is appended to session-1 automatically.
```

**Persisting conversations across restarts**

```ts
import { AI } from 'unlimited-ai';
import { readFileSync, writeFileSync } from 'node:fs';

const ai = new AI({ model: 'gpt-4o' });

// Restore saved conversations on startup
try {
  const saved = JSON.parse(readFileSync('conversations.json', 'utf-8'));
  ai.importConversations(saved);
} catch { /* no saved file yet */ }

ai.useConversation('session-1');
console.log(await ai.ask('Hello!'));

// Save all conversations before shutting down
writeFileSync('conversations.json', JSON.stringify(ai.exportConversations()));
```

**Traditional (manual history)**

```ts
import { AI } from 'unlimited-ai';

const ai = new AI();
const reply = await ai
  .setModel('gpt-4o')
  .addMessage({ role: 'system', content: 'You are a helpful assistant.' })
  .addMessage({ role: 'user', content: 'Hello!' })
  .generate();

console.log(reply);
```

---

## Functional API

### `generate(model, messages, raw?)`

```ts
generate(model: string, messages: Message[], raw?: false): Promise<string>
generate(model: string, messages: Message[], raw: true): Promise<CompletionResponse>
```

Sends a chat completion request and returns the result.

**`model`** `string`  
Model ID (e.g. `'gpt-4o'`).

**`messages`** `Message[]`  
Conversation messages to send.

**`raw`** `boolean` *(optional, default: `false`)*  
When `true`, returns the full `CompletionResponse` object instead of just the reply string.

```ts
import { generate } from 'unlimited-ai';

const reply = await generate('gpt-4o', [{ role: 'user', content: 'Hello!' }]);

// Full response object
const raw = await generate('gpt-4o', messages, true);
console.log(raw.choices[0]?.message.content);
```

---

### `ask(model, prompt, system?)`

```ts
ask(model: string, prompt: string, system?: string): Promise<string>
```

One-shot helper that sends a single user message and returns the reply.

**`model`** `string`  
Model ID.

**`prompt`** `string`  
The user message to send.

**`system`** `string` *(optional)*  
System prompt. If provided, it is prepended as a `system` message.

```ts
import { ask } from 'unlimited-ai';

const reply = await ask('gpt-4o', 'Hello!', 'You are a helpful assistant.');
console.log(reply);
```

---

### `stream(model, messages)`

```ts
stream(model: string, messages: Message[]): AsyncGenerator<string>
```

Sends a chat completion request with streaming enabled and yields reply chunks as they arrive.

**`model`** `string`  
Model ID.

**`messages`** `Message[]`  
Conversation messages to send.

**Yields** `string`  
Successive text chunks of the reply.

```ts
import { stream } from 'unlimited-ai';

for await (const chunk of stream('gpt-4o', [{ role: 'user', content: 'Hello!' }])) {
  process.stdout.write(chunk);
}
```

---

### `models()`

```ts
models(): Promise<string[]>
```

Fetches the list of available model IDs from the API.

```ts
import { models } from 'unlimited-ai';

const list = await models();
// ['gpt-4o', 'gpt-4-turbo', 'gemini-1.5-flash', ...]
```

---

### `searchModels(word)`

```ts
searchModels(word: string): Promise<string[]>
```

Fuzzy-searches available model IDs by keyword and returns the closest matches.

**`word`** `string`  
Search keyword.

**Returns** `Promise<string[]>`  
Matching model IDs, ordered by similarity.

```ts
import { searchModels, generate } from 'unlimited-ai';

const [model] = await searchModels('gpt-4');
const reply = await generate(model, [{ role: 'user', content: 'Hi!' }]);
```

---

### `config`

```ts
import { config } from 'unlimited-ai';
```

A read-only object with the API endpoint URLs used internally.

**`config.API_URL`** `string`  
Chat completions endpoint. Default: `https://api.voids.top/v1/chat/completions`

**`config.MODELS_URL`** `string`  
Models list endpoint. Default: `https://api.voids.top/v1/models`

```ts
console.log(config.API_URL);    // https://api.voids.top/v1/chat/completions
console.log(config.MODELS_URL); // https://api.voids.top/v1/models
```

---

## Types

```ts
type Role = 'system' | 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}

type ConversationStore = Record<string, Message[]>;

interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: { content?: string; role?: string };
    finish_reason: string | null;
  }>;
}
```

---

## Support

[![Discord](https://discordapp.com/api/guilds/1369635074395344998/widget.png?style=banner2)](https://discord.gg/upSpdDgDha)

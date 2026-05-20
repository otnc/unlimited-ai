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

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `init.model` | `string` | Model name |
| `init.system` | `string` | System prompt |
| `init.messages` | `Message[]` | Initial static context |

### Methods

Methods return `this` (chainable) unless the table says otherwise.

**Static context** — prepended to every request. Useful for system prompts and few-shot examples.

| Method | Returns | Description |
| :--- | :--- | :--- |
| `setModel(model, search?)` | `this` | Set the model. `search: true` enables fuzzy-matching. |
| `setSystem(content)` | `this` | Set or replace the system prompt. |
| `setMessages(messages)` | `this` | Replace the static context array entirely. |
| `addMessage(message)` | `this` | Append a message to static context. |
| `removeMessage(index)` | `this` | Remove a message by index. |
| `clearMessages()` | `this` | Clear all static context. |
| `getFormat()` | `{ model, messages }` | Return a snapshot of the current static context. |
| `generate(raw?)` | `Promise<string>` | Send `this.messages` as-is. Pass `true` for the full response object. |

**Conversations** — per-ID history managed automatically.

| Method | Returns | Description |
| :--- | :--- | :--- |
| `useConversation(id)` | `this` | Switch the active conversation. Pass `null` to return to stateless mode. |
| `ask(prompt, id?)` | `Promise<string>` | Send a message. History is saved when an ID is active or provided; stateless otherwise. |
| `stream(prompt, id?)` | `AsyncGenerator<string>` | Same as `ask` but streams reply chunks. |
| `listConversations()` | `string[]` | Return all known conversation IDs. |
| `getConversationMessages(id)` | `Message[]` | Return a copy of a conversation's history. |
| `clearConversation(id)` | `this` | Empty a conversation's history. |
| `deleteConversation(id)` | `this` | Remove a conversation entirely. |
| `exportConversations()` | `ConversationStore` | Return a plain-object copy of all conversations (JSON-serializable). |
| `importConversations(data, replace?)` | `this` | Load conversations from a plain object. Merges by default; pass `true` to replace all existing conversations. |

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
import { generate } from 'unlimited-ai';

const reply = await generate('gpt-4o', [{ role: 'user', content: 'Hello!' }]);

// Full response object
const raw = await generate('gpt-4o', messages, true);
console.log(raw.choices[0]?.message.content);
```

### `ask(model, prompt, system?)`

```ts
import { ask } from 'unlimited-ai';

const reply = await ask('gpt-4o', 'Hello!', 'You are a helpful assistant.');
console.log(reply);
```

### `stream(model, messages)` → `AsyncGenerator<string>`

```ts
import { stream } from 'unlimited-ai';

for await (const chunk of stream('gpt-4o', [{ role: 'user', content: 'Hello!' }])) {
  process.stdout.write(chunk);
}
```

### `models()`

```ts
import { models } from 'unlimited-ai';

const list = await models();
// ['gpt-4o', 'gpt-4-turbo', 'gemini-1.5-flash', ...]
```

### `searchModels(word)`

Fuzzy-search model IDs by keyword.

```ts
import { searchModels, generate } from 'unlimited-ai';

const [model] = await searchModels('gpt-4');
const reply = await generate(model, [{ role: 'user', content: 'Hi!' }]);
```

### `config`

```ts
import { config } from 'unlimited-ai';

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

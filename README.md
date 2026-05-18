# unlimited-ai

Fast, minimal Node.js wrapper for the [Voids API](https://voids.top/).

> [!Note]
>   
> The Voids API is not affiliated with this package. For API issues, do not open GitHub issues here.

```sh
npm install unlimited-ai
```

## unlimited-ai is back!

Rewritten in TypeScript. `axios` replaced with `ky`.

<details>

<summary>See other changes...</summary>

`allModels()` renamed to `models()`. Curated model list removed. `searchModels()` no longer takes an `all` parameter.

</details>

> [!Caution]
>   
> v6.x and below are no longer supported.  
> `models()` below v6.x will not work.

---

## Quick start

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

Or with the functional API:

```ts
import { generate, models } from 'unlimited-ai';

const available = await models();
console.log(available); // ['gpt-4o', 'gemini-1.5-flash', ...]

const reply = await generate('gpt-4o', [
  { role: 'user', content: 'Hello!' },
]);

console.log(reply);
```

## API

### `new AI(init?)`

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `init.model` | `string` | Initial model name |
| `init.messages` | `Message[]` | Initial messages |

#### Methods (all chainable except `generate` and `getFormat`)

| Method | Returns | Description |
| :--- | :--- | :--- |
| `setModel(model, search?)` | `this` | Set the model. If `search` is `true`, the name is fuzzy-matched before each call. |
| `setMessages(messages)` | `this` | Replace the entire messages array. |
| `addMessage(message)` | `this` | Append a message. |
| `removeMessage(index)` | `this` | Remove the message at the given index. |
| `generate(raw?)` | `Promise<string>` | Send the request. Returns the reply string. |
| `generate(true)` | `Promise<CompletionResponse>` | Returns the full API response object. |
| `getFormat()` | `{ model, messages }` | Return a copy of the current state. |

### `generate(model, messages, raw?)`

Low-level function.

```ts
import { generate } from 'unlimited-ai';

const reply = await generate('gpt-4o', [
  { role: 'user', content: 'Hello!' },
]);

// raw response
const raw = await generate('gpt-4o', messages, true);
console.log(raw.choices[0].message.content);
```

### `models()`

Returns all available model IDs from the live Voids API.

```ts
import { models } from 'unlimited-ai';

const list = await models();
// ['gpt-4o', 'gpt-4-turbo', 'gemini-1.5-flash', ...]
```

### `searchModels(word)`

Fuzzy-search model IDs by keyword. Useful when you don't know the exact model name.

```ts
import { searchModels, generate } from 'unlimited-ai';

const [model] = await searchModels('gpt-4');
const reply = await generate(model, [{ role: 'user', content: 'Hi!' }]);
```

### `config`

The API endpoint URLs used internally.

```ts
import { config } from 'unlimited-ai';

console.log(config.API_URL);    // https://api.voids.top/v1/chat/completions
console.log(config.MODELS_URL); // https://api.voids.top/v1/models
```

### `Message` type

```ts
type Role = 'system' | 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}
```

## Support

[![Discord](https://discordapp.com/api/guilds/1369635074395344998/widget.png?style=banner2)](https://discord.gg/upSpdDgDha)

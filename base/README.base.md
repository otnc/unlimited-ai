# unlimited-ai

:::kiritan{locale=en}
Fast, minimal Node.js wrapper for the [Voids API](https://voids.top/) AI chat completions.

> [!Note]
> The Voids API is not affiliated with this package. For API issues, do not open GitHub issues here.
:::
:::kiritan{locale=ja}
[Voids API](https://voids.top/) の AI チャット補完機能の高速・軽量な Node.js ラッパーです。

> [!Note]
> Voids API はこのパッケージとは無関係です。API 自体の問題については、こちらの GitHub Issue に報告しないでください。
:::

```sh
npm install unlimited-ai
```

## unlimited-ai is back!

:::kiritan{locale=en}
Rewritten in TypeScript. `axios` replaced with `ofetch`.  
Conversation history is now supported via conversation IDs — previously, every call was stateless.

<details>

<summary>See other changes...</summary>

`allModels()` renamed to `models()`. Curated model list removed. `searchModels()` no longer takes an `all` parameter.

</details>

> [!Caution]
>   
> v6.x and below are no longer supported.  
> Some functions no longer work or have changed. Please update to v7 or later.
:::
:::kiritan{locale=ja}
TypeScript で書き直されました。`axios` は `ofetch` に置き換えられています。  
会話 ID による履歴管理に対応しました — 以前はすべての呼び出しがステートレスでした。

<details>

<summary>その他の変更点...</summary>

`allModels()` は `models()` に改名されました。キュレーション済みモデルリストは削除されました。`searchModels()` の `all` パラメータは廃止されました。

</details>

> [!Caution]
>   
> v6.x 以下はサポートされなくなりました。  
> 一部の関数はもう動かない、または仕様が変更されています。v7 かそれ以降に更新してください。
:::

---

:::kiritan{locale=en}
## Quick start

```ts
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

const ai = new AI({ model: 'gpt-4o', system: 'You are a helpful assistant.' });
console.log(await ai.ask('Hello!'));
```

Or with the functional API:

```ts
// ESM
import { generate, ask, models } from 'unlimited-ai';
// CJS
const { generate, ask, models } = require('unlimited-ai');

const list = await models();
console.log(list); // ['gpt-4o', 'gemini-1.5-flash', ...]

const reply = await generate('gpt-4o', [{ role: 'user', content: 'Hello!' }]);
console.log(reply);
```
:::
:::kiritan{locale=ja}
## クイックスタート

```ts
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

const ai = new AI({ model: 'gpt-4o', system: 'あなたは親切なアシスタントです。' });
console.log(await ai.ask('こんにちは！'));
```

関数型 API も使えます:

```ts
// ESM
import { generate, ask, models } from 'unlimited-ai';
// CJS
const { generate, ask, models } = require('unlimited-ai');

const list = await models();
console.log(list); // ['gpt-4o', 'gemini-1.5-flash', ...]

const reply = await generate('gpt-4o', [{ role: 'user', content: 'こんにちは！' }]);
console.log(reply);
```
:::

---

## `new AI(init?)`

```ts
new AI(init?: {
  model?: string;
  system?: string;
  messages?: Message[];
  request?: RequestOptions;
})
```

:::kiritan{locale=en}
Creates a new AI instance.

**`init.model`** `string` *(optional)*  
Model ID to use (e.g. `'gpt-4o'`).

**`init.system`** `string` *(optional)*  
System prompt. Prepended to every request as a `system` message.

**`init.messages`** `Message[]` *(optional)*  
Initial static context. These messages are prepended to every request.

**`init.request`** `RequestOptions` *(optional)*  
Default [request options](#request-options) for every request made by this instance.
:::
:::kiritan{locale=ja}
AI インスタンスを作成します。

**`init.model`** `string` *(省略可)*  
使用するモデル ID (例: `'gpt-4o'`)。

**`init.system`** `string` *(省略可)*  
システムプロンプト。すべてのリクエストに `system` メッセージとして先頭に付加されます。

**`init.messages`** `Message[]` *(省略可)*  
静的コンテキストの初期値。すべてのリクエストに先頭から付加されます。

**`init.request`** `RequestOptions` *(省略可)*  
このインスタンスが送るすべてのリクエストに適用する[リクエストオプション](#リクエストオプション)の既定値。
:::

---

:::kiritan{locale=en}
### Examples

**Multi-turn with `useConversation`**

```ts
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

const ai = new AI({ model: 'gpt-4o', system: 'You are a helpful assistant.' });

ai.useConversation('session-1');
console.log(await ai.ask('What is TypeScript?'));
console.log(await ai.ask('What about its type system?')); // full history sent
```

**Per-user histories (inline IDs)**

```ts
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

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
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

const ai = new AI({ model: 'gpt-4o' });

ai.useConversation('session-1');
for await (const chunk of ai.stream('Tell me a joke.')) {
  process.stdout.write(chunk);
}
// The full reply is appended to session-1 automatically.
```

**Persisting conversations across restarts**

```ts
// ESM
import { AI } from 'unlimited-ai';
import { readFileSync, writeFileSync } from 'node:fs';
// CJS
const { AI } = require('unlimited-ai');
const { readFileSync, writeFileSync } = require('node:fs');

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
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

const ai = new AI();
const reply = await ai
  .setModel('gpt-4o')
  .addMessage({ role: 'system', content: 'You are a helpful assistant.' })
  .addMessage({ role: 'user', content: 'Hello!' })
  .generate();

console.log(reply);
```
:::
:::kiritan{locale=ja}
### 使用例

**`useConversation` による多ターン会話**

```ts
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

const ai = new AI({ model: 'gpt-4o', system: 'あなたは親切なアシスタントです。' });

ai.useConversation('session-1');
console.log(await ai.ask('TypeScript とは何ですか？'));
console.log(await ai.ask('型システムについて教えてください。')); // 会話履歴ごと送信
```

**ユーザーごとに独立した履歴 (ID をその場で指定)**

```ts
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

const ai = new AI({ model: 'gpt-4o', system: 'あなたは親切なアシスタントです。' });

await ai.ask('こんにちは！', 'user-alice');
await ai.ask('やあ！', 'user-bob');
await ai.ask('覚えてる？', 'user-alice'); // alice の履歴が復元される
```

**ステートレス**

```ts
const reply = await ai.ask('2 + 2 は？');
// 静的コンテキスト + このプロンプトだけを送信。何も保存されない。
```

**ストリーミング**

```ts
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

const ai = new AI({ model: 'gpt-4o' });

ai.useConversation('session-1');
for await (const chunk of ai.stream('ジョークを教えてください。')) {
  process.stdout.write(chunk);
}
// 完了後、全文が session-1 の履歴に自動追加される。
```

**再起動後も会話履歴を維持する**

```ts
// ESM
import { AI } from 'unlimited-ai';
import { readFileSync, writeFileSync } from 'node:fs';
// CJS
const { AI } = require('unlimited-ai');
const { readFileSync, writeFileSync } = require('node:fs');

const ai = new AI({ model: 'gpt-4o' });

// 起動時に保存済みの会話を復元
try {
  const saved = JSON.parse(readFileSync('conversations.json', 'utf-8'));
  ai.importConversations(saved);
} catch { /* 保存ファイルがまだない */ }

ai.useConversation('session-1');
console.log(await ai.ask('こんにちは！'));

// 終了前に全会話を保存
writeFileSync('conversations.json', JSON.stringify(ai.exportConversations()));
```

**従来の書き方 (手動で履歴を管理)**

```ts
// ESM
import { AI } from 'unlimited-ai';
// CJS
const { AI } = require('unlimited-ai');

const ai = new AI();
const reply = await ai
  .setModel('gpt-4o')
  .addMessage({ role: 'system', content: 'あなたは親切なアシスタントです。' })
  .addMessage({ role: 'user', content: 'こんにちは！' })
  .generate();

console.log(reply);
```
:::

---

:::kiritan{locale=en}
### Static context

Static context messages are prepended to every request. Useful for system prompts and few-shot examples. All methods return `this` and are chainable.
:::
:::kiritan{locale=ja}
### 静的コンテキスト

静的コンテキストのメッセージはすべてのリクエストに先頭から付加されます。システムプロンプトや few-shot 例の設定に使います。すべてのメソッドは `this` を返し、チェーン可能です。
:::

---

#### `setModel(model, search?)`

```ts
setModel(model: string, search?: boolean): this
```

:::kiritan{locale=en}
Sets the model for subsequent requests.

**`model`** `string`  
Model ID (e.g. `'gpt-4o'`).

**`search`** `boolean` *(optional, default: `false`)*  
When `true`, runs a fuzzy search via `searchModels` and uses the closest matching model ID.
:::
:::kiritan{locale=ja}
以降のリクエストで使用するモデルを設定します。

**`model`** `string`  
モデル ID (例: `'gpt-4o'`)。

**`search`** `boolean` *(省略可、デフォルト: `false`)*  
`true` の場合、`searchModels` によるファジー検索を行い、最も近いモデル ID を使用します。
:::

---

#### `setSystem(content)`

```ts
setSystem(content: string): this
```

:::kiritan{locale=en}
Sets or replaces the system prompt. If a `system` message already exists in the static context, it is replaced in-place; otherwise one is prepended.

**`content`** `string`  
System prompt text.
:::
:::kiritan{locale=ja}
システムプロンプトを設定または置き換えます。静的コンテキストに `system` メッセージが既に存在する場合はその場で置き換え、なければ先頭に追加します。

**`content`** `string`  
システムプロンプトのテキスト。
:::

---

#### `setMessages(messages)`

```ts
setMessages(messages: Message[]): this
```

:::kiritan{locale=en}
Replaces the entire static context array.

**`messages`** `Message[]`  
New static context. Overwrites the previous value entirely.
:::
:::kiritan{locale=ja}
静的コンテキスト全体を置き換えます。

**`messages`** `Message[]`  
新しい静的コンテキスト。既存の値をすべて上書きします。
:::

---

#### `addMessage(message)`

```ts
addMessage(message: Message): this
```

:::kiritan{locale=en}
Appends a single message to the static context.

**`message`** `Message`  
Message to append (`{ role, content }`).
:::
:::kiritan{locale=ja}
静的コンテキストの末尾にメッセージを 1 件追加します。

**`message`** `Message`  
追加するメッセージ (`{ role, content }`)。
:::

---

#### `removeMessage(index)`

```ts
removeMessage(index: number): this
```

:::kiritan{locale=en}
Removes a message from the static context by index. Throws `RangeError` if the index is out of bounds.

**`index`** `number`  
Zero-based index of the message to remove.
:::
:::kiritan{locale=ja}
静的コンテキストから指定インデックスのメッセージを削除します。インデックスが範囲外の場合は `RangeError` をスローします。

**`index`** `number`  
削除するメッセージのゼロ始まりインデックス。
:::

---

#### `clearMessages()`

```ts
clearMessages(): this
```

:::kiritan{locale=en}
Removes all messages from the static context.
:::
:::kiritan{locale=ja}
静的コンテキストのメッセージをすべて削除します。
:::

---

#### `setRequestOptions(options)`

```ts
setRequestOptions(options: RequestOptions): this
```

:::kiritan{locale=en}
Replaces the instance's default [request options](#request-options). Options passed to a single call still override them.

**`options`** `RequestOptions`  
New default request options. Overwrites the previous value entirely.
:::
:::kiritan{locale=ja}
インスタンスの既定の[リクエストオプション](#リクエストオプション)を置き換えます。呼び出しごとに渡したオプションはこれより優先されます。

**`options`** `RequestOptions`  
新しい既定のリクエストオプション。既存の値をすべて上書きします。
:::

---

#### `getFormat()`

```ts
getFormat(): { model: string; messages: Message[] }
```

:::kiritan{locale=en}
Returns a snapshot of the current model and static context. The returned `messages` array is a shallow copy — mutating it does not affect the instance.
:::
:::kiritan{locale=ja}
現在のモデルと静的コンテキストのスナップショットを返します。返される `messages` 配列はシャローコピーであり、変更してもインスタンスには影響しません。
:::

---

#### `generate(raw?, options?)`

```ts
generate(raw?: false, options?: RequestOptions): Promise<string>
generate(raw: true, options?: RequestOptions): Promise<CompletionResponse>
```

:::kiritan{locale=en}
Sends the current static context (`this.messages`) as-is and returns the reply.

**`raw`** `boolean` *(optional, default: `false`)*  
When `true`, returns the full `CompletionResponse` object instead of just the reply string.

**`options`** `RequestOptions` *(optional)*  
[Request options](#request-options) for this call only. Merged over the instance's defaults.
:::
:::kiritan{locale=ja}
現在の静的コンテキスト (`this.messages`) をそのまま送信し、返答を返します。

**`raw`** `boolean` *(省略可、デフォルト: `false`)*  
`true` の場合、返答文字列の代わりに `CompletionResponse` オブジェクト全体を返します。

**`options`** `RequestOptions` *(省略可)*  
この呼び出しだけに適用する[リクエストオプション](#リクエストオプション)。インスタンスの既定値に上書きでマージされます。
:::

---

:::kiritan{locale=en}
### Conversations

Per-conversation history is managed automatically and kept separate from the static context. All methods return `this` and are chainable unless noted otherwise.
:::
:::kiritan{locale=ja}
### 会話管理

会話ごとの履歴は自動管理され、静的コンテキストとは独立して保持されます。特記のないメソッドはすべて `this` を返し、チェーン可能です。
:::

---

#### `useConversation(id)`

```ts
useConversation(id: string | null): this
```

:::kiritan{locale=en}
Sets the active conversation for subsequent `ask` and `stream` calls. Pass `null` to return to stateless mode.

**`id`** `string | null`  
Conversation ID to activate. Any non-empty string is valid (UUID, snowflake, username, etc.). When a new ID is used, an empty history is created automatically.
:::
:::kiritan{locale=ja}
以降の `ask` / `stream` 呼び出しで使用するアクティブな会話を設定します。`null` を渡すとステートレスモードに戻ります。

**`id`** `string | null`  
有効化する会話 ID。空でない任意の文字列が使えます (UUID、Snowflake、ユーザー名など)。新しい ID を指定した場合、空の履歴が自動的に作成されます。
:::

---

#### `ask(prompt, id?, options?)`

```ts
ask(prompt: string, id?: string, options?: RequestOptions): Promise<string>
```

:::kiritan{locale=en}
Sends a message and returns the reply.

- If `id` is provided, or an active conversation is set via `useConversation`, the user message and reply are appended to that conversation's history.
- If no ID is active, the call is stateless — only the static context and this prompt are sent, and nothing is saved.

**`prompt`** `string`  
The user message to send.

**`id`** `string` *(optional)*  
Conversation ID. Overrides the active conversation set by `useConversation` for this call only. Pass `undefined` to use the active conversation while still passing `options`.

**`options`** `RequestOptions` *(optional)*  
[Request options](#request-options) for this call only. Merged over the instance's defaults.

**Returns** `Promise<string>`  
The assistant's reply.
:::
:::kiritan{locale=ja}
メッセージを送信し、返答を返します。

- `id` が指定されているか、`useConversation` でアクティブな会話が設定されている場合、ユーザーメッセージと返答がその会話の履歴に追加されます。
- ID が未指定の場合はステートレス — 静的コンテキストとこのプロンプトのみを送信し、何も保存されません。

**`prompt`** `string`  
送信するユーザーメッセージ。

**`id`** `string` *(省略可)*  
会話 ID。このメソッド呼び出しの間だけ、`useConversation` で設定したアクティブな会話を上書きします。アクティブな会話のまま `options` だけ渡したいときは `undefined` を渡してください。

**`options`** `RequestOptions` *(省略可)*  
この呼び出しだけに適用する[リクエストオプション](#リクエストオプション)。インスタンスの既定値に上書きでマージされます。

**戻り値** `Promise<string>`  
アシスタントの返答。
:::

---

#### `stream(prompt, id?, options?)`

```ts
stream(prompt: string, id?: string, options?: RequestOptions): AsyncGenerator<string>
```

:::kiritan{locale=en}
Same as `ask`, but yields the reply as chunks as they arrive. After the generator is exhausted, the full assembled reply is saved to the conversation history (if an ID is active).

**`prompt`** `string`  
The user message to send.

**`id`** `string` *(optional)*  
Conversation ID. Overrides the active conversation for this call only.

**`options`** `RequestOptions` *(optional)*  
[Request options](#request-options) for this call only. Merged over the instance's defaults.

**Yields** `string`  
Successive text chunks of the reply.
:::
:::kiritan{locale=ja}
`ask` と同じですが、返答をチャンク単位でストリーミングします。ジェネレーターが完了した後、組み立てた全文が会話履歴に保存されます (ID が有効な場合)。

**`prompt`** `string`  
送信するユーザーメッセージ。

**`id`** `string` *(省略可)*  
会話 ID。このメソッド呼び出しの間だけアクティブな会話を上書きします。

**`options`** `RequestOptions` *(省略可)*  
この呼び出しだけに適用する[リクエストオプション](#リクエストオプション)。インスタンスの既定値に上書きでマージされます。

**Yields** `string`  
返答のテキストチャンク。
:::

---

#### `listConversations()`

```ts
listConversations(): string[]
```

:::kiritan{locale=en}
Returns an array of all known conversation IDs.
:::
:::kiritan{locale=ja}
既存のすべての会話 ID の配列を返します。
:::

---

#### `getConversationMessages(id)`

```ts
getConversationMessages(id: string): Message[]
```

:::kiritan{locale=en}
Returns a copy of the message history for the given conversation. Mutating the returned array does not affect the stored history.

**`id`** `string`  
Conversation ID.
:::
:::kiritan{locale=ja}
指定した会話のメッセージ履歴のコピーを返します。返された配列を変更しても、保存済みの履歴には影響しません。

**`id`** `string`  
会話 ID。
:::

---

#### `clearConversation(id)`

```ts
clearConversation(id: string): this
```

:::kiritan{locale=en}
Empties the message history for the given conversation without removing the conversation itself.

**`id`** `string`  
Conversation ID.
:::
:::kiritan{locale=ja}
指定した会話のメッセージ履歴を空にします。会話そのものは削除されません。

**`id`** `string`  
会話 ID。
:::

---

#### `deleteConversation(id)`

```ts
deleteConversation(id: string): this
```

:::kiritan{locale=en}
Removes the conversation and its history entirely.

**`id`** `string`  
Conversation ID.
:::
:::kiritan{locale=ja}
指定した会話とその履歴を完全に削除します。

**`id`** `string`  
会話 ID。
:::

---

#### `exportConversations(id?)`

```ts
exportConversations(id: string): Message[]
exportConversations(): ConversationStore
```

:::kiritan{locale=en}
Exports conversation history as a plain, JSON-serializable value.

- When `id` is provided, returns a copy of that conversation's `Message[]`.
- When called without arguments, returns a `ConversationStore` (a plain object keyed by conversation ID) containing copies of all conversations.

**`id`** `string` *(optional)*  
Conversation ID. When omitted, all conversations are exported.
:::
:::kiritan{locale=ja}
会話履歴を JSON シリアライズ可能なプレーン値としてエクスポートします。

- `id` を指定した場合、その会話の `Message[]` のコピーを返します。
- 引数なしの場合、すべての会話を含む `ConversationStore` (会話 ID をキーとするプレーンオブジェクト) を返します。

**`id`** `string` *(省略可)*  
会話 ID。省略するとすべての会話をエクスポートします。
:::

---

#### `importConversations(data, replace?)`

```ts
importConversations(data: ConversationStore, replace?: boolean): this
```

:::kiritan{locale=en}
Loads conversations from a plain object (e.g. parsed from JSON). Useful for restoring history after a restart.

**`data`** `ConversationStore`  
Plain object mapping conversation IDs to `Message[]` arrays.

**`replace`** `boolean` *(optional, default: `false`)*  
When `false` (default), incoming conversations are merged with existing ones. When `true`, all existing conversations are cleared before importing.
:::
:::kiritan{locale=ja}
プレーンオブジェクト (JSON パース済みなど) から会話を読み込みます。再起動後の履歴復元に使います。

**`data`** `ConversationStore`  
会話 ID から `Message[]` 配列へのマッピングオブジェクト。

**`replace`** `boolean` *(省略可、デフォルト: `false`)*  
`false` (デフォルト) の場合、既存の会話にインポートした内容をマージします。`true` の場合、インポート前に既存の会話をすべてクリアします。
:::

---

:::kiritan{locale=en}
## Functional API
:::
:::kiritan{locale=ja}
## 関数型 API
:::

### `generate(model, messages, raw?, options?)`

```ts
generate(model: string, messages: Message[], raw?: false, options?: RequestOptions): Promise<string>
generate(model: string, messages: Message[], raw: true, options?: RequestOptions): Promise<CompletionResponse>
```

:::kiritan{locale=en}
```ts
// ESM
import { generate } from 'unlimited-ai';
// CJS
const { generate } = require('unlimited-ai');

const reply = await generate('gpt-4o', [{ role: 'user', content: 'Hello!' }]);

// Full response object
const raw = await generate('gpt-4o', messages, true);
console.log(raw.choices[0]?.message.content);
```

Sends a chat completion request and returns the result.

**`model`** `string`  
Model ID (e.g. `'gpt-4o'`).

**`messages`** `Message[]`  
Conversation messages to send.

**`raw`** `boolean` *(optional, default: `false`)*  
When `true`, returns the full `CompletionResponse` object instead of just the reply string.

**`options`** `RequestOptions` *(optional)*  
[Request options](#request-options).
:::
:::kiritan{locale=ja}
```ts
// ESM
import { generate } from 'unlimited-ai';
// CJS
const { generate } = require('unlimited-ai');

const reply = await generate('gpt-4o', [{ role: 'user', content: 'こんにちは！' }]);

// レスポンスオブジェクト全体を取得
const raw = await generate('gpt-4o', messages, true);
console.log(raw.choices[0]?.message.content);
```

チャット補完リクエストを送信し、結果を返します。

**`model`** `string`  
モデル ID (例: `'gpt-4o'`)。

**`messages`** `Message[]`  
送信する会話メッセージ。

**`raw`** `boolean` *(省略可、デフォルト: `false`)*  
`true` の場合、返答文字列の代わりに `CompletionResponse` オブジェクト全体を返します。

**`options`** `RequestOptions` *(省略可)*  
[リクエストオプション](#リクエストオプション)。
:::

---

### `ask(model, prompt, system?, options?)`

```ts
ask(model: string, prompt: string, system?: string, options?: RequestOptions): Promise<string>
```

:::kiritan{locale=en}
```ts
// ESM
import { ask } from 'unlimited-ai';
// CJS
const { ask } = require('unlimited-ai');

const reply = await ask('gpt-4o', 'Hello!', 'You are a helpful assistant.');
console.log(reply);
```

One-shot helper that sends a single user message and returns the reply.

**`model`** `string`  
Model ID.

**`prompt`** `string`  
The user message to send.

**`system`** `string` *(optional)*  
System prompt. If provided, it is prepended as a `system` message.

**`options`** `RequestOptions` *(optional)*  
[Request options](#request-options).
:::
:::kiritan{locale=ja}
```ts
// ESM
import { ask } from 'unlimited-ai';
// CJS
const { ask } = require('unlimited-ai');

const reply = await ask('gpt-4o', 'こんにちは！', 'あなたは親切なアシスタントです。');
console.log(reply);
```

ユーザーメッセージを 1 件送信して返答を返すシンプルなヘルパーです。

**`model`** `string`  
モデル ID。

**`prompt`** `string`  
送信するユーザーメッセージ。

**`system`** `string` *(省略可)*  
システムプロンプト。指定した場合、`system` メッセージとして先頭に付加されます。

**`options`** `RequestOptions` *(省略可)*  
[リクエストオプション](#リクエストオプション)。
:::

---

### `stream(model, messages, options?)`

```ts
stream(model: string, messages: Message[], options?: RequestOptions): AsyncGenerator<string>
```

:::kiritan{locale=en}
```ts
// ESM
import { stream } from 'unlimited-ai';
// CJS
const { stream } = require('unlimited-ai');

for await (const chunk of stream('gpt-4o', [{ role: 'user', content: 'Hello!' }])) {
  process.stdout.write(chunk);
}
```

Sends a chat completion request with streaming enabled and yields reply chunks as they arrive.

**`model`** `string`  
Model ID.

**`messages`** `Message[]`  
Conversation messages to send.

**`options`** `RequestOptions` *(optional)*  
[Request options](#request-options).

**Yields** `string`  
Successive text chunks of the reply.
:::
:::kiritan{locale=ja}
```ts
// ESM
import { stream } from 'unlimited-ai';
// CJS
const { stream } = require('unlimited-ai');

for await (const chunk of stream('gpt-4o', [{ role: 'user', content: 'こんにちは！' }])) {
  process.stdout.write(chunk);
}
```

ストリーミングを有効にしてチャット補完リクエストを送信し、返答チャンクを順次 yield します。

**`model`** `string`  
モデル ID。

**`messages`** `Message[]`  
送信する会話メッセージ。

**`options`** `RequestOptions` *(省略可)*  
[リクエストオプション](#リクエストオプション)。

**Yields** `string`  
返答のテキストチャンク。
:::

---

### `models(options?)`

```ts
models(options?: RequestOptions): Promise<string[]>
```

```ts
// ESM
import { models } from 'unlimited-ai';
// CJS
const { models } = require('unlimited-ai');

const list = await models();
// ['gpt-4o', 'gpt-4-turbo', 'gemini-1.5-flash', ...]
```

:::kiritan{locale=en}
Fetches the list of available model IDs from the API.

**`options`** `RequestOptions` *(optional)*  
[Request options](#request-options).
:::
:::kiritan{locale=ja}
API から利用可能なモデル ID の一覧を取得して返します。

**`options`** `RequestOptions` *(省略可)*  
[リクエストオプション](#リクエストオプション)。
:::

---

### `searchModels(word, options?)`

```ts
searchModels(word: string, options?: RequestOptions): Promise<string[]>
```

:::kiritan{locale=en}
```ts
// ESM
import { searchModels, generate } from 'unlimited-ai';
// CJS
const { searchModels, generate } = require('unlimited-ai');

const [model] = await searchModels('gpt-4');
const reply = await generate(model, [{ role: 'user', content: 'Hi!' }]);
```

Fuzzy-searches available model IDs by keyword and returns the closest matches.

**`word`** `string`  
Search keyword.

**`options`** `RequestOptions` *(optional)*  
[Request options](#request-options) for fetching the model list.

**Returns** `Promise<string[]>`  
Matching model IDs, ordered by similarity.
:::
:::kiritan{locale=ja}
```ts
// ESM
import { searchModels, generate } from 'unlimited-ai';
// CJS
const { searchModels, generate } = require('unlimited-ai');

const [model] = await searchModels('gpt-4');
const reply = await generate(model, [{ role: 'user', content: 'こんにちは！' }]);
```

キーワードで利用可能なモデル ID をファジー検索し、近い順に返します。

**`word`** `string`  
検索キーワード。

**`options`** `RequestOptions` *(省略可)*  
モデル一覧の取得に使う[リクエストオプション](#リクエストオプション)。

**戻り値** `Promise<string[]>`  
類似度の高い順に並んだモデル ID。
:::

---

### `config`

```ts
// ESM
import { config } from 'unlimited-ai';
// CJS
const { config } = require('unlimited-ai');
```

```ts
console.log(config.API_URL);    // https://api.voids.top/v1/chat/completions
console.log(config.MODELS_URL); // https://api.voids.top/v1/models
```

:::kiritan{locale=en}
A read-only object with the API endpoint URLs used internally.

**`config.API_URL`** `string`  
Chat completions endpoint. Default: `https://api.voids.top/v1/chat/completions`

**`config.MODELS_URL`** `string`  
Models list endpoint. Default: `https://api.voids.top/v1/models`
:::
:::kiritan{locale=ja}
内部で使用している API エンドポイント URL を持つ読み取り専用オブジェクトです。

**`config.API_URL`** `string`  
チャット補完エンドポイント。デフォルト: `https://api.voids.top/v1/chat/completions`

**`config.MODELS_URL`** `string`  
モデル一覧エンドポイント。デフォルト: `https://api.voids.top/v1/models`
:::

---

:::kiritan{locale=en}
## Request options
:::
:::kiritan{locale=ja}
## リクエストオプション
:::

```ts
interface RequestOptions {
  retry?: number | false;
  retryDelay?: number;
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}
```

:::kiritan{locale=en}
Every function and method that sends a request takes `RequestOptions` as its last argument. Options given to `new AI({ request })` or `setRequestOptions()` apply to every request from that instance, and options given to a single call override them field by field (`headers` are merged).

```ts
const ai = new AI({
  model: 'gpt-4o',
  request: { retry: 2, retryDelay: 1000, timeout: 30_000 },
});

// Disable retrying for this call only
await ai.ask('Hello!', undefined, { retry: false });

// Cancel a stream after 5 seconds
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
for await (const chunk of ai.stream('Tell me a story.', undefined, { signal: controller.signal })) {
  process.stdout.write(chunk);
}
```

**`retry`** `number | false` *(optional)*  
Number of retries after a failed attempt, or `false` to disable retrying. When omitted, ofetch's default applies: chat completion requests (POST) are not retried, and model list requests (GET) are retried once. Network errors and responses with status 408, 429, 500, 502, 503 or 504 are retried.

**`retryDelay`** `number` *(optional, default: `0`)*  
Delay between retries in milliseconds.

**`timeout`** `number` *(optional)*  
Time limit in milliseconds for the whole call, including retries. For `stream`, it also covers reading the reply, so leave enough time for the full answer. No limit when omitted.

**`headers`** `Record<string, string>` *(optional)*  
Extra request headers.

**`signal`** `AbortSignal` *(optional)*  
Cancels the request when aborted.

A response with an error status rejects with ofetch's `FetchError` (`error.status` holds the status code). A timeout or an abort rejects with the signal's reason (a `TimeoutError` or `AbortError`).
:::
:::kiritan{locale=ja}
リクエストを送るすべての関数・メソッドは、最後の引数に `RequestOptions` を受け取ります。`new AI({ request })` や `setRequestOptions()` で渡したオプションはそのインスタンスのすべてのリクエストに適用され、呼び出しごとに渡したオプションがフィールド単位でそれを上書きします (`headers` はマージされます)。

```ts
const ai = new AI({
  model: 'gpt-4o',
  request: { retry: 2, retryDelay: 1000, timeout: 30_000 },
});

// この呼び出しだけリトライを無効化
await ai.ask('こんにちは！', undefined, { retry: false });

// 5 秒後にストリームをキャンセル
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
for await (const chunk of ai.stream('物語を聞かせて。', undefined, { signal: controller.signal })) {
  process.stdout.write(chunk);
}
```

**`retry`** `number | false` *(省略可)*  
失敗後にリトライする回数。`false` でリトライを無効化します。省略時は ofetch の既定に従い、チャット補完 (POST) はリトライせず、モデル一覧の取得 (GET) は 1 回リトライします。リトライの対象はネットワークエラーと、ステータス 408・429・500・502・503・504 のレスポンスです。

**`retryDelay`** `number` *(省略可、デフォルト: `0`)*  
リトライの間隔 (ミリ秒)。

**`timeout`** `number` *(省略可)*  
リトライを含めた呼び出し全体の制限時間 (ミリ秒)。`stream` では返答の受信も含むため、全文を受け取れるだけの時間を指定してください。省略時は無制限です。

**`headers`** `Record<string, string>` *(省略可)*  
追加のリクエストヘッダー。

**`signal`** `AbortSignal` *(省略可)*  
abort されるとリクエストをキャンセルします。

エラーステータスのレスポンスは ofetch の `FetchError` で reject されます (`error.status` にステータスコードが入ります)。タイムアウトや abort の場合は signal の reason (`TimeoutError` または `AbortError`) で reject されます。
:::

---

:::kiritan{locale=en}
## Types
:::
:::kiritan{locale=ja}
## 型定義
:::

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

interface RequestOptions {
  retry?: number | false;
  retryDelay?: number;
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}
```

---

:::kiritan{locale=en}
## Support
:::
:::kiritan{locale=ja}
## サポート
:::

[![Discord](https://discordapp.com/api/guilds/1369635074395344998/widget.png?style=banner2)](https://discord.gg/upSpdDgDha)

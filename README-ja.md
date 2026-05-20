# unlimited-ai

[English](README.md) | **日本語**

[Voids API](https://voids.top/) の AI チャット補完機能の高速・軽量な Node.js ラッパーです。

> [!Note]
> Voids API はこのパッケージとは無関係です。API 自体の問題については、こちらの GitHub Issue に報告しないでください。

```sh
npm install unlimited-ai
```

## unlimited-ai is back!

TypeScript で書き直されました。`axios` は `ky` に置き換えられています。  
会話 ID による履歴管理に対応しました — 以前はすべての呼び出しがステートレスでした。

<details>

<summary>その他の変更点...</summary>

`allModels()` は `models()` に改名されました。キュレーション済みモデルリストは削除されました。`searchModels()` の `all` パラメータは廃止されました。

</details>

> [!Caution]
>
> v6.x 以下はサポートされなくなりました。  
> 一部の関数はもう動かない、または仕様が変更されています。v7 かそれ以降に更新してください。

---

## クイックスタート

```ts
import { AI } from 'unlimited-ai';

const ai = new AI({ model: 'gpt-4o', system: 'あなたは親切なアシスタントです。' });
console.log(await ai.ask('こんにちは！'));
```

関数型 API も使えます：

```ts
import { generate, ask, models } from 'unlimited-ai';

const list = await models();
console.log(list); // ['gpt-4o', 'gemini-1.5-flash', ...]

const reply = await generate('gpt-4o', [{ role: 'user', content: 'こんにちは！' }]);
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

AI インスタンスを作成します。

**`init.model`** `string` *(省略可)*  
使用するモデル ID（例: `'gpt-4o'`）。

**`init.system`** `string` *(省略可)*  
システムプロンプト。すべてのリクエストに `system` メッセージとして先頭に付加されます。

**`init.messages`** `Message[]` *(省略可)*  
静的コンテキストの初期値。すべてのリクエストに先頭から付加されます。

---

### 静的コンテキスト

静的コンテキストのメッセージはすべてのリクエストに先頭から付加されます。システムプロンプトや few-shot 例の設定に使います。すべてのメソッドは `this` を返し、チェーン可能です。

---

#### `setModel(model, search?)`

```ts
setModel(model: string, search?: boolean): this
```

以降のリクエストで使用するモデルを設定します。

**`model`** `string`  
モデル ID（例: `'gpt-4o'`）。

**`search`** `boolean` *(省略可、デフォルト: `false`)*  
`true` の場合、`searchModels` によるファジー検索を行い、最も近いモデル ID を使用します。

---

#### `setSystem(content)`

```ts
setSystem(content: string): this
```

システムプロンプトを設定または置き換えます。静的コンテキストに `system` メッセージが既に存在する場合はその場で置き換え、なければ先頭に追加します。

**`content`** `string`  
システムプロンプトのテキスト。

---

#### `setMessages(messages)`

```ts
setMessages(messages: Message[]): this
```

静的コンテキスト全体を置き換えます。

**`messages`** `Message[]`  
新しい静的コンテキスト。既存の値をすべて上書きします。

---

#### `addMessage(message)`

```ts
addMessage(message: Message): this
```

静的コンテキストの末尾にメッセージを 1 件追加します。

**`message`** `Message`  
追加するメッセージ（`{ role, content }`）。

---

#### `removeMessage(index)`

```ts
removeMessage(index: number): this
```

静的コンテキストから指定インデックスのメッセージを削除します。インデックスが範囲外の場合は `RangeError` をスローします。

**`index`** `number`  
削除するメッセージのゼロ始まりインデックス。

---

#### `clearMessages()`

```ts
clearMessages(): this
```

静的コンテキストのメッセージをすべて削除します。

---

#### `getFormat()`

```ts
getFormat(): { model: string; messages: Message[] }
```

現在のモデルと静的コンテキストのスナップショットを返します。返される `messages` 配列はシャローコピーであり、変更してもインスタンスには影響しません。

---

#### `generate(raw?)`

```ts
generate(raw?: false): Promise<string>
generate(raw: true): Promise<CompletionResponse>
```

現在の静的コンテキスト（`this.messages`）をそのまま送信し、返答を返します。

**`raw`** `boolean` *(省略可、デフォルト: `false`)*  
`true` の場合、返答文字列の代わりに `CompletionResponse` オブジェクト全体を返します。

---

### 会話管理

会話ごとの履歴は自動管理され、静的コンテキストとは独立して保持されます。特記のないメソッドはすべて `this` を返し、チェーン可能です。

---

#### `useConversation(id)`

```ts
useConversation(id: string | null): this
```

以降の `ask` / `stream` 呼び出しで使用するアクティブな会話を設定します。`null` を渡すとステートレスモードに戻ります。

**`id`** `string | null`  
有効化する会話 ID。空でない任意の文字列が使えます（UUID、Snowflake、ユーザー名など）。新しい ID を指定した場合、空の履歴が自動的に作成されます。

---

#### `ask(prompt, id?)`

```ts
ask(prompt: string, id?: string): Promise<string>
```

メッセージを送信し、返答を返します。

- `id` が指定されているか、`useConversation` でアクティブな会話が設定されている場合、ユーザーメッセージと返答がその会話の履歴に追加されます。
- ID が未指定の場合はステートレス — 静的コンテキストとこのプロンプトのみを送信し、何も保存されません。

**`prompt`** `string`  
送信するユーザーメッセージ。

**`id`** `string` *(省略可)*  
会話 ID。このメソッド呼び出しの間だけ、`useConversation` で設定したアクティブな会話を上書きします。

**戻り値** `Promise<string>`  
アシスタントの返答。

---

#### `stream(prompt, id?)`

```ts
stream(prompt: string, id?: string): AsyncGenerator<string>
```

`ask` と同じですが、返答をチャンク単位でストリーミングします。ジェネレーターが完了した後、組み立てた全文が会話履歴に保存されます（ID が有効な場合）。

**`prompt`** `string`  
送信するユーザーメッセージ。

**`id`** `string` *(省略可)*  
会話 ID。このメソッド呼び出しの間だけアクティブな会話を上書きします。

**Yields** `string`  
返答のテキストチャンク。

---

#### `listConversations()`

```ts
listConversations(): string[]
```

既存のすべての会話 ID の配列を返します。

---

#### `getConversationMessages(id)`

```ts
getConversationMessages(id: string): Message[]
```

指定した会話のメッセージ履歴のコピーを返します。返された配列を変更しても、保存済みの履歴には影響しません。

**`id`** `string`  
会話 ID。

---

#### `clearConversation(id)`

```ts
clearConversation(id: string): this
```

指定した会話のメッセージ履歴を空にします。会話そのものは削除されません。

**`id`** `string`  
会話 ID。

---

#### `deleteConversation(id)`

```ts
deleteConversation(id: string): this
```

指定した会話とその履歴を完全に削除します。

**`id`** `string`  
会話 ID。

---

#### `exportConversations(id?)`

```ts
exportConversations(id: string): Message[]
exportConversations(): ConversationStore
```

会話履歴を JSON シリアライズ可能なプレーン値としてエクスポートします。

- `id` を指定した場合、その会話の `Message[]` のコピーを返します。
- 引数なしの場合、すべての会話を含む `ConversationStore`（会話 ID をキーとするプレーンオブジェクト）を返します。

**`id`** `string` *(省略可)*  
会話 ID。省略するとすべての会話をエクスポートします。

---

#### `importConversations(data, replace?)`

```ts
importConversations(data: ConversationStore, replace?: boolean): this
```

プレーンオブジェクト（JSON パース済みなど）から会話を読み込みます。再起動後の履歴復元に使います。

**`data`** `ConversationStore`  
会話 ID から `Message[]` 配列へのマッピングオブジェクト。

**`replace`** `boolean` *(省略可、デフォルト: `false`)*  
`false`（デフォルト）の場合、既存の会話にインポートした内容をマージします。`true` の場合、インポート前に既存の会話をすべてクリアします。

---

### 使用例

**`useConversation` による多ターン会話**

```ts
import { AI } from 'unlimited-ai';

const ai = new AI({ model: 'gpt-4o', system: 'あなたは親切なアシスタントです。' });

ai.useConversation('session-1');
console.log(await ai.ask('TypeScript とは何ですか？'));
console.log(await ai.ask('型システムについて教えてください。')); // 会話履歴ごと送信
```

**ユーザーごとに独立した履歴（ID をその場で指定）**

```ts
import { AI } from 'unlimited-ai';

const ai = new AI({ model: 'gpt-4o', system: 'あなたは親切なアシスタントです。' });

await ai.ask('こんにちは！', 'user-alice');
await ai.ask('やあ！', 'user-bob');
await ai.ask('覚えてる？', 'user-alice'); // alice の履歴が復元される
```

**ステートレス**

```ts
const reply = await ai.ask('2 + 2 は？');
// 静的コンテキスト＋このプロンプトだけを送信。何も保存されない。
```

**ストリーミング**

```ts
import { AI } from 'unlimited-ai';

const ai = new AI({ model: 'gpt-4o' });

ai.useConversation('session-1');
for await (const chunk of ai.stream('ジョークを教えてください。')) {
  process.stdout.write(chunk);
}
// 完了後、全文が session-1 の履歴に自動追加される。
```

**再起動後も会話履歴を維持する**

```ts
import { AI } from 'unlimited-ai';
import { readFileSync, writeFileSync } from 'node:fs';

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

**従来の書き方（手動で履歴を管理）**

```ts
import { AI } from 'unlimited-ai';

const ai = new AI();
const reply = await ai
  .setModel('gpt-4o')
  .addMessage({ role: 'system', content: 'あなたは親切なアシスタントです。' })
  .addMessage({ role: 'user', content: 'こんにちは！' })
  .generate();

console.log(reply);
```

---

## 関数型 API

### `generate(model, messages, raw?)`

```ts
generate(model: string, messages: Message[], raw?: false): Promise<string>
generate(model: string, messages: Message[], raw: true): Promise<CompletionResponse>
```

チャット補完リクエストを送信し、結果を返します。

**`model`** `string`  
モデル ID（例: `'gpt-4o'`）。

**`messages`** `Message[]`  
送信する会話メッセージ。

**`raw`** `boolean` *(省略可、デフォルト: `false`)*  
`true` の場合、返答文字列の代わりに `CompletionResponse` オブジェクト全体を返します。

```ts
import { generate } from 'unlimited-ai';

const reply = await generate('gpt-4o', [{ role: 'user', content: 'こんにちは！' }]);

// レスポンスオブジェクト全体を取得
const raw = await generate('gpt-4o', messages, true);
console.log(raw.choices[0]?.message.content);
```

---

### `ask(model, prompt, system?)`

```ts
ask(model: string, prompt: string, system?: string): Promise<string>
```

ユーザーメッセージを 1 件送信して返答を返すシンプルなヘルパーです。

**`model`** `string`  
モデル ID。

**`prompt`** `string`  
送信するユーザーメッセージ。

**`system`** `string` *(省略可)*  
システムプロンプト。指定した場合、`system` メッセージとして先頭に付加されます。

```ts
import { ask } from 'unlimited-ai';

const reply = await ask('gpt-4o', 'こんにちは！', 'あなたは親切なアシスタントです。');
console.log(reply);
```

---

### `stream(model, messages)`

```ts
stream(model: string, messages: Message[]): AsyncGenerator<string>
```

ストリーミングを有効にしてチャット補完リクエストを送信し、返答チャンクを順次 yield します。

**`model`** `string`  
モデル ID。

**`messages`** `Message[]`  
送信する会話メッセージ。

**Yields** `string`  
返答のテキストチャンク。

```ts
import { stream } from 'unlimited-ai';

for await (const chunk of stream('gpt-4o', [{ role: 'user', content: 'こんにちは！' }])) {
  process.stdout.write(chunk);
}
```

---

### `models()`

```ts
models(): Promise<string[]>
```

API から利用可能なモデル ID の一覧を取得して返します。

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

キーワードで利用可能なモデル ID をファジー検索し、近い順に返します。

**`word`** `string`  
検索キーワード。

**戻り値** `Promise<string[]>`  
類似度の高い順に並んだモデル ID。

```ts
import { searchModels, generate } from 'unlimited-ai';

const [model] = await searchModels('gpt-4');
const reply = await generate(model, [{ role: 'user', content: 'こんにちは！' }]);
```

---

### `config`

```ts
import { config } from 'unlimited-ai';
```

内部で使用している API エンドポイント URL を持つ読み取り専用オブジェクトです。

**`config.API_URL`** `string`  
チャット補完エンドポイント。デフォルト: `https://api.voids.top/v1/chat/completions`

**`config.MODELS_URL`** `string`  
モデル一覧エンドポイント。デフォルト: `https://api.voids.top/v1/models`

```ts
console.log(config.API_URL);    // https://api.voids.top/v1/chat/completions
console.log(config.MODELS_URL); // https://api.voids.top/v1/models
```

---

## 型定義

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

## サポート

[![Discord](https://discordapp.com/api/guilds/1369635074395344998/widget.png?style=banner2)](https://discord.gg/upSpdDgDha)

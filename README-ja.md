# unlimited-ai

[Voids API](https://voids.top/) の高速・軽量な Node.js ラッパーです。

> [!Note]
> Voids API はこのパッケージとは無関係です。API 自体の問題については、こちらの GitHub Issue に報告しないでください。

```sh
npm install unlimited-ai
```

[English](README.md)

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
> v6.x 以下の `models()` は動作しません。

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

| パラメータ | 型 | 説明 |
| :--- | :--- | :--- |
| `init.model` | `string` | モデル名 |
| `init.system` | `string` | システムプロンプト |
| `init.messages` | `Message[]` | 静的コンテキストの初期値 |

### メソッド

表に明記した場合を除き、すべてのメソッドは `this` を返します（チェーン可能）。

**静的コンテキスト** — すべてのリクエストに先頭から付加されます。システムプロンプトや few-shot 例の設定に使います。

| メソッド | 返り値 | 説明 |
| :--- | :--- | :--- |
| `setModel(model, search?)` | `this` | モデルを設定。`search: true` でファジー検索を有効化。 |
| `setSystem(content)` | `this` | システムプロンプトを設定または置き換える。 |
| `setMessages(messages)` | `this` | 静的コンテキストを丸ごと置き換える。 |
| `addMessage(message)` | `this` | 静的コンテキストにメッセージを追加。 |
| `removeMessage(index)` | `this` | 指定インデックスのメッセージを削除。 |
| `clearMessages()` | `this` | 静的コンテキストをすべて削除。 |
| `getFormat()` | `{ model, messages }` | 現在の静的コンテキストのスナップショットを返す。 |
| `generate(raw?)` | `Promise<string>` | `this.messages` をそのまま送信。`true` を渡すとレスポンス全体を返す。 |

**会話管理** — ID ごとの履歴を自動管理します。

| メソッド | 返り値 | 説明 |
| :--- | :--- | :--- |
| `useConversation(id)` | `this` | アクティブな会話を切り替える。`null` を渡すとステートレスモードに戻る。 |
| `ask(prompt, id?)` | `Promise<string>` | メッセージを送信。ID が有効なら履歴を保存。なければステートレス。 |
| `stream(prompt, id?)` | `AsyncGenerator<string>` | `ask` と同じだが返答をチャンク単位でストリーミング。 |
| `listConversations()` | `string[]` | 既存の会話 ID の一覧を返す。 |
| `getConversationMessages(id)` | `Message[]` | 指定した会話の履歴のコピーを返す。 |
| `clearConversation(id)` | `this` | 指定した会話の履歴を空にする。 |
| `deleteConversation(id)` | `this` | 指定した会話を完全に削除する。 |

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
import { generate } from 'unlimited-ai';

const reply = await generate('gpt-4o', [{ role: 'user', content: 'こんにちは！' }]);

// レスポンスオブジェクト全体を取得
const raw = await generate('gpt-4o', messages, true);
console.log(raw.choices[0]?.message.content);
```

### `ask(model, prompt, system?)`

```ts
import { ask } from 'unlimited-ai';

const reply = await ask('gpt-4o', 'こんにちは！', 'あなたは親切なアシスタントです。');
console.log(reply);
```

### `stream(model, messages)` → `AsyncGenerator<string>`

```ts
import { stream } from 'unlimited-ai';

for await (const chunk of stream('gpt-4o', [{ role: 'user', content: 'こんにちは！' }])) {
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

キーワードでモデル ID をファジー検索します。

```ts
import { searchModels, generate } from 'unlimited-ai';

const [model] = await searchModels('gpt-4');
const reply = await generate(model, [{ role: 'user', content: 'こんにちは！' }]);
```

### `config`

```ts
import { config } from 'unlimited-ai';

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

export type Role = 'system' | 'user' | 'assistant';

export interface Message {
  role: Role;
  content: string;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelListResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    owned_by: string;
  }>;
}

export type ConversationStore = Record<string, Message[]>;

export interface StreamChunk {
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

export interface RequestOptions {
  /** Number of retries, or `false` to disable retrying. Defaults to ofetch's behavior: 1 for GET, 0 for POST. */
  retry?: number | false;
  /** Delay between retries in milliseconds. */
  retryDelay?: number;
  /** Time limit in milliseconds for the whole call, including retries and, for streams, reading the reply. */
  timeout?: number;
  /** Extra request headers. Merged with, and overriding, the instance-level headers. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

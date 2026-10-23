import { closeWords } from 'closewords';
import { models } from './models.js';
import type { RequestOptions } from './types.js';

export async function searchModels(word: string, options?: RequestOptions): Promise<string[]> {
  if (typeof word !== 'string') throw new TypeError('word must be a string.');
  const data = await models(options);
  return closeWords(word, data);
}

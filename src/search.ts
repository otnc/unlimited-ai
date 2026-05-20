import { closeWords } from 'closewords';
import { models } from './models.js';

export async function searchModels(word: string): Promise<string[]> {
  if (typeof word !== 'string') throw new TypeError('word must be a string.');
  const data = await models();
  return closeWords(word, data);
}

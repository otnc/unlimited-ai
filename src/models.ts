import ky from 'ky';
import { config } from './config.js';
import type { ModelListResponse } from './types.js';

export async function models(): Promise<string[]> {
  const data = await ky.get(config.MODELS_URL).json<ModelListResponse>();
  return data.data.map((d) => d.id);
}

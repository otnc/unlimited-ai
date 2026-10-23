import { config } from './config.js';
import { http, toFetchOptions } from './http.js';
import { validateRequestOptions } from './utils.js';
import type { ModelListResponse, RequestOptions } from './types.js';

export async function models(options?: RequestOptions): Promise<string[]> {
  validateRequestOptions(options);
  const data = await http<ModelListResponse>(config.MODELS_URL, toFetchOptions(options));
  return data.data.map((d) => d.id);
}

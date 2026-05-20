export const config = {
  API_URL: 'https://api.voids.top/v1/chat/completions',
  MODELS_URL: 'https://api.voids.top/v1/models',
} as const;

export type Config = typeof config;

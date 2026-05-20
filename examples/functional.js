import { generate } from 'unlimited-ai';

const reply = await generate('gpt-4o', [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
]);

console.log(reply);

import { searchModels, generate } from 'unlimited-ai';

// Find the closest model to the given keyword
const [model] = await searchModels('gpt-4');
console.log('Using model:', model);

const reply = await generate(model, [{ role: 'user', content: 'Hello!' }]);
console.log(reply);

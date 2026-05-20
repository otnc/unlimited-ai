import { AI } from 'unlimited-ai';

const ai = new AI({ model: 'gpt-4o', system: 'You are a helpful assistant.' });

process.stdout.write('Assistant: ');
for await (const chunk of ai.stream('Tell me a short joke.')) {
  process.stdout.write(chunk);
}
process.stdout.write('\n');

// Second turn — history is maintained automatically
process.stdout.write('Assistant: ');
for await (const chunk of ai.stream('Explain why that is funny.')) {
  process.stdout.write(chunk);
}
process.stdout.write('\n');

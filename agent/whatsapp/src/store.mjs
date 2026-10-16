// Append-only JSONL store. Read-only capture: nothing here sends WhatsApp messages.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function openStore(dir) {
  mkdirSync(dir, { recursive: true });
  const messagesFile = join(dir, 'messages.jsonl');
  const tasksFile = join(dir, 'tasks.jsonl');

  const readAll = (file) =>
    existsSync(file)
      ? readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line))
      : [];

  const seen = new Set(readAll(messagesFile).map((m) => m.id));

  return {
    hasMessage: (id) => seen.has(id),
    saveMessage(message) {
      if (seen.has(message.id)) return false;
      seen.add(message.id);
      appendFileSync(messagesFile, JSON.stringify(message) + '\n');
      return true;
    },
    saveTasks(tasks) {
      for (const task of tasks) appendFileSync(tasksFile, JSON.stringify(task) + '\n');
      return tasks.length;
    },
    listTasks: () => readAll(tasksFile),
  };
}

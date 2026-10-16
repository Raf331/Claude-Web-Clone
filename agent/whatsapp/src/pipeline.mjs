import { normalizeMessage } from './normalize.mjs';
import { extractTasks } from './extract.mjs';

// allowedChatIds is the read scope. Anything outside it is dropped before storage.
export function ingest(rawPayload, { store, allowedChatIds }) {
  const items = Array.isArray(rawPayload) ? rawPayload : [rawPayload];
  const result = { received: items.length, outOfScope: 0, duplicates: 0, invalid: 0, stored: 0, tasks: 0 };

  for (const raw of items) {
    const message = normalizeMessage(raw ?? {});
    if (!message) {
      result.invalid += 1;
      continue;
    }
    if (!allowedChatIds.has(message.chatId)) {
      result.outOfScope += 1;
      continue;
    }
    if (!store.saveMessage(message)) {
      result.duplicates += 1;
      continue;
    }
    result.stored += 1;
    result.tasks += store.saveTasks(extractTasks(message));
  }
  return result;
}

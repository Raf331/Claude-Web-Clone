import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../src/store.mjs';
import { ingest } from '../src/pipeline.mjs';
import { extractTasks } from '../src/extract.mjs';

const GROUP = '120363000000000000@g.us';
const OTHER = '15550100999@c.us';
const fresh = () => openStore(mkdtempSync(join(tmpdir(), 'wa-capture-')));
const msg = (over = {}) => ({
  id: 'm1',
  chat_id: GROUP,
  sender: '15550100123@c.us',
  text: 'Great work on the launch. Can you send the Q3 report by Friday?',
  timestamp: 1767225600,
  ...over,
});

test('stores in-scope messages and extracts request sentences as tasks', () => {
  const store = fresh();
  const result = ingest(msg(), { store, allowedChatIds: new Set([GROUP]) });
  assert.equal(result.stored, 1);
  assert.equal(result.tasks, 1);
  assert.match(store.listTasks()[0].text, /Can you send the Q3 report/);
});

test('drops messages from chats outside the read scope', () => {
  const store = fresh();
  const result = ingest(msg({ chat_id: OTHER }), { store, allowedChatIds: new Set([GROUP]) });
  assert.equal(result.outOfScope, 1);
  assert.equal(result.stored, 0);
});

test('deduplicates redelivered webhooks', () => {
  const store = fresh();
  const scope = { store, allowedChatIds: new Set([GROUP]) };
  ingest(msg(), scope);
  const second = ingest(msg(), scope);
  assert.equal(second.duplicates, 1);
  assert.equal(store.listTasks().length, 1);
});

test('counts invalid payloads without throwing', () => {
  const store = fresh();
  const result = ingest([{ foo: 'bar' }, null], { store, allowedChatIds: new Set([GROUP]) });
  assert.equal(result.invalid, 2);
});

test('extractor ignores small talk', () => {
  assert.deepEqual(extractTasks({ id: 'x', chatId: GROUP, text: 'Good morning all.' }), []);
});

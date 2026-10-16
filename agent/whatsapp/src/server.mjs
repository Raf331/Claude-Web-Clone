// Webhook receiver. Refuses to start without a secret and an allowlist of chats.
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { openStore } from './store.mjs';
import { ingest } from './pipeline.mjs';

const { WEBHOOK_SECRET, ALLOWED_CHAT_IDS, STORE_DIR = './data', PORT = '8787' } = process.env;
if (!WEBHOOK_SECRET) throw new Error('WEBHOOK_SECRET is required');
if (!ALLOWED_CHAT_IDS) throw new Error('ALLOWED_CHAT_IDS is required (comma-separated chat ids)');

const allowedChatIds = new Set(ALLOWED_CHAT_IDS.split(',').map((s) => s.trim()).filter(Boolean));
const store = openStore(STORE_DIR);
const expected = Buffer.from(WEBHOOK_SECRET);

const safeEqual = (value) => {
  const actual = Buffer.from(value ?? '');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404).end();
    return;
  }
  if (!safeEqual(req.headers['x-webhook-secret'])) {
    res.writeHead(401).end();
    return;
  }
  let body = '';
  for await (const chunk of req) body += chunk;
  try {
    const result = ingest(JSON.parse(body), { store, allowedChatIds });
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(result));
  } catch {
    res.writeHead(400).end();
  }
}).listen(Number(PORT), () => console.log(`whatsapp capture listening on :${PORT}`));

// Maps an inbound WhatsApp webhook payload to one message record.
// Field aliases cover the common shapes; confirm against the real Blueticks payload.
const pick = (obj, keys) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return undefined;
};

export function normalizeMessage(raw) {
  const id = pick(raw, ['id', 'messageId', 'message_id', 'key_id']);
  const chatId = pick(raw, ['chatId', 'chat_id', 'remoteJid', 'from_chat']);
  const text = pick(raw, ['text', 'body', 'message']);
  const sender = pick(raw, ['sender', 'author', 'participant', 'from']);
  const timestamp = pick(raw, ['timestamp', 'ts', 'time']);

  if (!id || !chatId || typeof text !== 'string') return null;

  return {
    id: String(id),
    chatId: String(chatId),
    sender: sender ? String(sender) : 'unknown',
    text: text.trim(),
    timestamp: timestamp ? new Date(Number(timestamp) * (String(timestamp).length === 10 ? 1000 : 1)).toISOString() : new Date().toISOString(),
  };
}

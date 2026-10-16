// Heuristic task extractor (v0). Flags sentences that look like requests or deadlines.
// Replace with an LLM extractor behind the same signature once Marketsync's task model is known.
const CUE = /\b(please|can you|could you|need to|needs to|need you|todo|action item|follow up|follow-up|send|update|by (mon|tue|wed|thu|fri|sat|sun|tomorrow|today|eod|end of day)|deadline|due)\b/i;

export function extractTasks(message) {
  const sentences = message.text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences
    .filter((s) => CUE.test(s))
    .map((s) => ({
      sourceMessageId: message.id,
      chatId: message.chatId,
      text: s,
      status: 'open',
      extractor: 'heuristic-v0',
    }));
}

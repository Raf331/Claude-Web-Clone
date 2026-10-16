# WhatsApp capture agent (read-only, v0)

Reads messages from an allowlisted set of WhatsApp chats, stores them, and extracts
candidate tasks with a heuristic. It never sends messages.

## Run
    WEBHOOK_SECRET=... ALLOWED_CHAT_IDS=120363...@g.us STORE_DIR=./data node src/server.mjs
    node --test test/

## Not done yet
- No WhatsApp number is linked to the Blueticks account (engine status empty as of this build).
- Blueticks payload field names are guessed by `normalize.mjs`; confirm against a real payload.
- Marketsync tracker integration is absent: the task model and destination are unknown.
- Heuristic extraction only; swap in an LLM extractor once task definitions exist.
- Draft-and-approve sending is intentionally not built.

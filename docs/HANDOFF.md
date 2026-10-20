# SouqStack Books — handoff

Branch: `claude/exciting-mayer-zvtcei`

## Goal
In-house bookkeeping + invoicing app for SouqStack (UAE, AED, 5% VAT, TRN 104912312600003),
replacing invoicing in "Accountable". Hosted on Azure (startup credits).

## Decisions made
- Stack: Next.js 16 (App Router) + Drizzle ORM + PostgreSQL.
  - Azure: App Service (Linux, `output: "standalone"`) + Azure Database for PostgreSQL Flexible Server.
  - Local dev/tests: PGlite (embedded Postgres) when `DATABASE_URL` is unset.
- Money = bigint fils, qty = integer thousandths, rates = basis points. VAT rounded per line.
- Double-entry ledger, auto-posted from issued documents; issued documents are immutable
  (void = reversal entry; corrections via credit/debit notes). Lock date blocks back-dating.
- E-invoicing: UAE model goes through an Accredited Service Provider (PEPPOL PINT AE).
  App generates UBL XML + readiness checks and exposes a clean hand-off to an ASP. It does not
  claim compliance on its own.
- AI: Claude API (`@anthropic-ai/sdk`, model `claude-opus-5-5`, structured outputs via
  `messages.parse` + `zodOutputFormat`) for (1) PO / supplier invoice PDF → draft document,
  (2) questions about the books.

## Done
- `src/db/schema.ts` — Postgres schema (contacts, items, accounts, documents + lines,
  payments, journal entries + lines, settings, audit log).
- `src/lib/money.ts` — parsing/formatting, line + document totals, amount in words.
- `src/lib/accounting/chart.ts` — default UAE chart of accounts with system keys.

## Not done / next
1. `src/db/index.ts` still uses the old libsql driver — rewrite for `pg` (Azure) / PGlite (local).
   Generate migrations with `npx drizzle-kit generate`; add migrate + seed script.
2. Posting service (invoice, credit note, bill, debit note, payments, void/reversal, opening balances).
3. Document service: draft/save/issue/void/convert (quote→invoice/DO, PO→bill, invoice→DO/credit note).
4. UI: dashboard, contacts, items, documents (list/new/view/print, SouqStack branding #0EA5E9,
   logo at `public/images/souqstack-logo.png`), payments, journal, reports (trial balance, P&L,
   balance sheet, VAT return, aged AR/AP, statement of account), settings, backup/restore.
5. Password gate via `proxy.ts` (Next 16 name for middleware) before any deployment.
6. Accountable data backup: needs a session on the user's own computer with the
   Claude in Chrome extension connected (cloud sessions cannot reach their Chrome).
   Export everything (customers, items, invoices, quotes, payments) → CSV/JSON in `data/import/`
   (gitignored), then build an importer.
7. Mockup in progress: Design canvas https://claude.ai/artifact/9hWhNF4RwHTTAMWTkNS6N6
   (logo uploaded; artboards planned: Dashboard, Tax invoice, AI import PO→DO,
   Statement of account, VAT return + P&L). User wants mockup first, then the working slice
   (dashboard + customers + create/issue/print invoice posting to the ledger).

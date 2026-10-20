import "server-only";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Local default is a SQLite file. For hosting, set DATABASE_URL to a Turso/libSQL URL.
const url = process.env.DATABASE_URL ?? "file:data/books.db";

const globalForDb = globalThis as unknown as { libsql?: ReturnType<typeof createClient> };
const client =
  globalForDb.libsql ?? createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbOrTx = Db | Tx;

import {
  pgTable,
  pgEnum,
  text,
  integer,
  bigint,
  boolean,
  serial,
  date,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Money columns are bigint fils (1 AED = 100 fils) to avoid float rounding.
// Quantities are integer thousandths (1 unit = 1000) so 0.5 kg works.
// Rates are integer basis points (500 = 5%).
const money = (name: string) => bigint(name, { mode: "number" });

export const contactKind = pgEnum("contact_kind", ["customer", "supplier", "both"]);
export const accountType = pgEnum("account_type", ["asset", "liability", "equity", "income", "expense"]);
export const documentKind = pgEnum("document_kind", [
  "quotation",
  "invoice",
  "credit_note",
  "purchase_order",
  "bill",
  "debit_note",
  "delivery_note",
]);
export const documentStatus = pgEnum("document_status", ["draft", "issued", "void"]);
export const vatCategory = pgEnum("vat_category", ["S", "Z", "E", "O"]);
export const einvoiceStatus = pgEnum("einvoice_status", [
  "not_applicable",
  "pending",
  "submitted",
  "accepted",
  "rejected",
]);
export const paymentDirection = pgEnum("payment_direction", ["in", "out"]);
export const journalSource = pgEnum("journal_source", ["document", "payment", "manual", "opening", "reversal"]);

export const accountTypes = accountType.enumValues;
export type AccountType = (typeof accountTypes)[number];
export const documentKinds = documentKind.enumValues;
export type DocumentKind = (typeof documentKinds)[number];
export type DocumentStatus = (typeof documentStatus.enumValues)[number];
export type VatCategory = (typeof vatCategory.enumValues)[number];

export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  companyName: text("company_name").notNull(),
  legalName: text("legal_name").notNull(),
  trn: text("trn").notNull(),
  addressLine1: text("address_line1").notNull().default(""),
  addressLine2: text("address_line2").notNull().default(""),
  city: text("city").notNull().default("Dubai"),
  emirate: text("emirate").notNull().default("Dubai"),
  country: text("country").notNull().default("AE"),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  website: text("website").notNull().default(""),
  currency: text("currency").notNull().default("AED"),
  defaultVatRate: integer("default_vat_rate").notNull().default(500),
  bankDetails: text("bank_details").notNull().default(""),
  invoiceTerms: text("invoice_terms").notNull().default(""),
  // Nothing dated on or before the lock date can be posted, changed or voided.
  lockDate: date("lock_date", { mode: "string" }),
});

export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    kind: contactKind("kind").notNull(),
    name: text("name").notNull(),
    contactPerson: text("contact_person").notNull().default(""),
    trn: text("trn").notNull().default(""),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    address: text("address").notNull().default(""),
    emirate: text("emirate").notNull().default(""),
    country: text("country").notNull().default("AE"),
    paymentTermsDays: integer("payment_terms_days").notNull().default(30),
    // Positive = they owe us (customer) / we owe them (supplier), as at the opening date.
    openingBalance: money("opening_balance").notNull().default(0),
    openingDate: date("opening_date", { mode: "string" }),
    notes: text("notes").notNull().default(""),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("contacts_name_idx").on(t.name)],
);

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().default(""),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("Nos"),
  salePrice: money("sale_price").notNull().default(0),
  purchasePrice: money("purchase_price").notNull().default(0),
  vatRate: integer("vat_rate").notNull().default(500),
  vatCategory: vatCategory("vat_category").notNull().default("S"),
  archived: boolean("archived").notNull().default(false),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: accountType("type").notNull(),
  // System accounts are used by automatic posting and cannot be archived.
  systemKey: text("system_key").unique(),
  isBank: boolean("is_bank").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
});

export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    kind: documentKind("kind").notNull(),
    number: text("number").notNull(),
    status: documentStatus("status").notNull().default("draft"),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id),
    date: date("date", { mode: "string" }).notNull(),
    dueDate: date("due_date", { mode: "string" }),
    reference: text("reference").notNull().default(""), // customer PO no, supplier invoice no, etc.
    sourceId: integer("source_id"), // document this one was converted from
    notes: text("notes").notNull().default(""),
    terms: text("terms").notNull().default(""),
    currency: text("currency").notNull().default("AED"),
    subtotal: money("subtotal").notNull().default(0),
    discountTotal: money("discount_total").notNull().default(0),
    vatTotal: money("vat_total").notNull().default(0),
    total: money("total").notNull().default(0),
    deliveryAddress: text("delivery_address").notNull().default(""),
    vehicleNo: text("vehicle_no").notNull().default(""),
    driverName: text("driver_name").notNull().default(""),
    uuid: uuid("uuid").notNull().defaultRandom(),
    einvoiceStatus: einvoiceStatus("einvoice_status").notNull().default("not_applicable"),
    einvoiceNote: text("einvoice_note").notNull().default(""),
    issuedAt: timestamp("issued_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("documents_kind_number_uq").on(t.kind, t.number),
    index("documents_kind_date_idx").on(t.kind, t.date),
    index("documents_contact_idx").on(t.contactId),
  ],
);

export const documentLines = pgTable(
  "document_lines",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    itemId: integer("item_id").references(() => items.id),
    sku: text("sku").notNull().default(""),
    description: text("description").notNull(),
    unit: text("unit").notNull().default("Nos"),
    qty: integer("qty").notNull(),
    qtyDelivered: integer("qty_delivered"),
    unitPrice: money("unit_price").notNull().default(0),
    discountPct: integer("discount_pct").notNull().default(0),
    vatRate: integer("vat_rate").notNull().default(500),
    vatCategory: vatCategory("vat_category").notNull().default("S"),
    accountId: integer("account_id").references(() => accounts.id),
    lineSubtotal: money("line_subtotal").notNull().default(0),
    lineVat: money("line_vat").notNull().default(0),
  },
  (t) => [index("document_lines_doc_idx").on(t.documentId)],
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    direction: paymentDirection("direction").notNull(),
    number: text("number").notNull().unique(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id),
    documentId: integer("document_id").references(() => documents.id),
    date: date("date", { mode: "string" }).notNull(),
    amount: money("amount").notNull(),
    bankAccountId: integer("bank_account_id")
      .notNull()
      .references(() => accounts.id),
    method: text("method").notNull().default("bank_transfer"),
    reference: text("reference").notNull().default(""),
    notes: text("notes").notNull().default(""),
    voided: boolean("voided").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("payments_contact_idx").on(t.contactId), index("payments_document_idx").on(t.documentId)],
);

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    number: text("number").notNull().unique(),
    date: date("date", { mode: "string" }).notNull(),
    memo: text("memo").notNull().default(""),
    sourceType: journalSource("source_type").notNull(),
    sourceId: integer("source_id"),
    reversesId: integer("reverses_id"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  },
  (t) => [index("journal_source_idx").on(t.sourceType, t.sourceId), index("journal_date_idx").on(t.date)],
);

export const journalLines = pgTable(
  "journal_lines",
  {
    id: serial("id").primaryKey(),
    entryId: integer("entry_id")
      .notNull()
      .references(() => journalEntries.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id),
    contactId: integer("contact_id").references(() => contacts.id),
    description: text("description").notNull().default(""),
    debit: money("debit").notNull().default(0),
    credit: money("credit").notNull().default(0),
  },
  (t) => [index("journal_lines_account_idx").on(t.accountId), index("journal_lines_entry_idx").on(t.entryId)],
);

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  at: timestamp("at", { mode: "string" }).notNull().defaultNow(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  detail: text("detail").notNull().default(""),
});

export type Contact = typeof contacts.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentLine = typeof documentLines.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Settings = typeof settings.$inferSelect;

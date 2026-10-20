import type { AccountType } from "@/db/schema";

export const SYSTEM_ACCOUNTS = {
  bank: "bank",
  cash: "cash",
  receivables: "receivables",
  vatInput: "vat_input",
  payables: "payables",
  vatOutput: "vat_output",
  equity: "equity",
  retained: "retained",
  openingBalance: "opening_balance",
  sales: "sales",
  purchases: "purchases",
} as const;
export type SystemKey = (typeof SYSTEM_ACCOUNTS)[keyof typeof SYSTEM_ACCOUNTS];

export interface ChartRow {
  code: string;
  name: string;
  type: AccountType;
  systemKey?: SystemKey;
  isBank?: boolean;
}

/** Default chart of accounts for a UAE trading company. */
export const DEFAULT_CHART: ChartRow[] = [
  { code: "1000", name: "Bank - Current Account", type: "asset", systemKey: "bank", isBank: true },
  { code: "1010", name: "Petty Cash", type: "asset", systemKey: "cash", isBank: true },
  { code: "1100", name: "Accounts Receivable", type: "asset", systemKey: "receivables" },
  { code: "1200", name: "Inventory", type: "asset" },
  { code: "1300", name: "VAT Recoverable (Input VAT)", type: "asset", systemKey: "vat_input" },
  { code: "1400", name: "Prepayments & Deposits", type: "asset" },
  { code: "1500", name: "Fixed Assets - Equipment", type: "asset" },
  { code: "1510", name: "Accumulated Depreciation", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability", systemKey: "payables" },
  { code: "2100", name: "Accrued Expenses", type: "liability" },
  { code: "2200", name: "VAT Payable (Output VAT)", type: "liability", systemKey: "vat_output" },
  { code: "2300", name: "Corporate Tax Payable", type: "liability" },
  { code: "2400", name: "End of Service Benefits Provision", type: "liability" },
  { code: "3000", name: "Owner's Capital", type: "equity", systemKey: "equity" },
  { code: "3100", name: "Retained Earnings", type: "equity", systemKey: "retained" },
  { code: "3200", name: "Owner's Drawings", type: "equity" },
  { code: "3900", name: "Opening Balance Equity", type: "equity", systemKey: "opening_balance" },
  { code: "4000", name: "Sales", type: "income", systemKey: "sales" },
  { code: "4100", name: "Service Income", type: "income" },
  { code: "4900", name: "Other Income", type: "income" },
  { code: "5000", name: "Cost of Goods Sold - Purchases", type: "expense", systemKey: "purchases" },
  { code: "5100", name: "Freight & Customs", type: "expense" },
  { code: "6000", name: "Salaries & Wages", type: "expense" },
  { code: "6100", name: "Rent", type: "expense" },
  { code: "6200", name: "Utilities & Telecom", type: "expense" },
  { code: "6300", name: "Bank Charges", type: "expense" },
  { code: "6400", name: "Office Expenses", type: "expense" },
  { code: "6500", name: "Vehicle & Fuel", type: "expense" },
  { code: "6600", name: "Professional Fees", type: "expense" },
  { code: "6700", name: "Licences & Government Fees", type: "expense" },
  { code: "6800", name: "Marketing & Advertising", type: "expense" },
  { code: "6900", name: "Depreciation", type: "expense" },
  { code: "6950", name: "Exchange Gain/Loss", type: "expense" },
];

/** Accounts whose balance normally sits on the debit side. */
export function isDebitNormal(type: AccountType): boolean {
  return type === "asset" || type === "expense";
}

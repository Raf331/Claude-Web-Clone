// Money is stored as integer fils; quantities as integer thousandths; rates as basis points.

export const QTY_SCALE = 1000;
export const RATE_SCALE = 10000; // 500 bp = 5%

/** Round half away from zero, the convention used on UAE tax invoices. */
export function roundHalfUp(n: number): number {
  return n < 0 ? -Math.round(-n) : Math.round(n);
}

/** Parse a user-typed amount like "1,234.50" into fils. Returns NaN if invalid. */
export function parseMoney(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === "") return 0;
  if (typeof input === "number") return roundHalfUp(input * 100);
  const cleaned = input.replace(/[,\s]/g, "").replace(/^AED/i, "");
  if (!/^-?\d*(\.\d+)?$/.test(cleaned) || cleaned === "" || cleaned === "-") return NaN;
  return roundHalfUp(Number(cleaned) * 100);
}

export function parseQty(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === "") return 0;
  const n = typeof input === "number" ? input : Number(String(input).replace(/,/g, ""));
  return Number.isFinite(n) ? roundHalfUp(n * QTY_SCALE) : NaN;
}

export function parseRate(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === "") return 0;
  const n = typeof input === "number" ? input : Number(input);
  return Number.isFinite(n) ? roundHalfUp(n * 100) : NaN;
}

const moneyFmt = new Intl.NumberFormat("en-AE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 123456 -> "1,234.56" */
export function formatMoney(fils: number): string {
  return moneyFmt.format(fils / 100);
}

/** Accounting style: negatives shown in brackets. */
export function formatAccounting(fils: number): string {
  if (fils < 0) return `(${formatMoney(-fils)})`;
  return formatMoney(fils);
}

export function formatQty(thousandths: number): string {
  const n = thousandths / QTY_SCALE;
  return Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/0+$/, "");
}

export function formatRate(bp: number): string {
  const n = bp / 100;
  return `${Number.isInteger(n) ? n : n.toFixed(2)}%`;
}

export function toInputMoney(fils: number): string {
  return (fils / 100).toFixed(2);
}

export interface LineInput {
  qty: number; // thousandths
  unitPrice: number; // fils
  discountPct: number; // bp
  vatRate: number; // bp
}

export interface LineTotals {
  lineSubtotal: number;
  lineDiscount: number;
  lineVat: number;
}

/** VAT is calculated per line and rounded per line, then summed. */
export function computeLine(l: LineInput): LineTotals {
  const gross = roundHalfUp((l.qty * l.unitPrice) / QTY_SCALE);
  const lineDiscount = roundHalfUp((gross * l.discountPct) / RATE_SCALE);
  const lineSubtotal = gross - lineDiscount;
  const lineVat = roundHalfUp((lineSubtotal * l.vatRate) / RATE_SCALE);
  return { lineSubtotal, lineDiscount, lineVat };
}

export function computeTotals(lines: LineInput[]) {
  let subtotal = 0;
  let discountTotal = 0;
  let vatTotal = 0;
  for (const l of lines) {
    const t = computeLine(l);
    subtotal += t.lineSubtotal;
    discountTotal += t.lineDiscount;
    vatTotal += t.lineVat;
  }
  return { subtotal, discountTotal, vatTotal, total: subtotal + vatTotal };
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function under1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

/** "AED One Thousand Two Hundred and 50/100 Only" style amount in words. */
export function amountInWords(fils: number, currency = "AED"): string {
  const whole = Math.floor(Math.abs(fils) / 100);
  const frac = Math.abs(fils) % 100;
  const scales: [number, string][] = [
    [1_000_000_000, "Billion"],
    [1_000_000, "Million"],
    [1_000, "Thousand"],
  ];
  let rest = whole;
  const parts: string[] = [];
  for (const [size, name] of scales) {
    if (rest >= size) {
      parts.push(`${under1000(Math.floor(rest / size))} ${name}`);
      rest %= size;
    }
  }
  if (rest > 0) parts.push(under1000(rest));
  const words = parts.length ? parts.join(" ") : "Zero";
  const fils2 = frac ? ` and ${String(frac).padStart(2, "0")}/100` : "";
  return `${currency} ${words}${fils2} Only`;
}

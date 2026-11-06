// A receipt is printed in the formats of the business that issued it (its currency, language, time zone and decimals),
// whoever opens it — the host app or a guest.

export interface ReceiptLocale { currency?: string; language?: string; timezone?: string; price_decimals?: number; qty_decimals?: number }

export interface ReceiptFormat {
  /** amount with symbol: ₹1,234.50 */
  money: (minor: number) => string;
  /** amount without symbol, for table cells: 1,234.50 */
  num: (minor: number) => string;
  qty: (n: number) => string;
  when: (iso?: string) => string;
}

export function receiptFormat(b: ReceiptLocale = {}): ReceiptFormat {
  const currency = b.currency || 'INR';
  const d = b.price_decimals ?? 2;
  const loc = b.language === 'hi' ? 'hi-IN' : ['INR', 'NPR', 'LKR', 'BDT'].includes(currency) ? 'en-IN' : 'en-US';
  const money = new Intl.NumberFormat(loc, { style: 'currency', currency, minimumFractionDigits: d, maximumFractionDigits: d });
  const num = new Intl.NumberFormat(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
  const qty = new Intl.NumberFormat(loc, { maximumFractionDigits: b.qty_decimals ?? 2 });
  let dt: Intl.DateTimeFormat;
  try { dt = new Intl.DateTimeFormat(loc, { dateStyle: 'medium', timeStyle: 'short', timeZone: b.timezone || 'Asia/Kolkata' }); }
  catch { dt = new Intl.DateTimeFormat(loc, { dateStyle: 'medium', timeStyle: 'short' }); }
  return {
    money: (m) => money.format((m ?? 0) / 100),
    num: (m) => num.format((m ?? 0) / 100),
    qty: (n) => qty.format(n ?? 0),
    when: (iso) => (iso ? dt.format(new Date(iso)) : ''),
  };
}

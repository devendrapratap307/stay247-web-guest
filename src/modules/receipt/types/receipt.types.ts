export type ReceiptKind = 'sale' | 'order' | 'kot' | 'booking' | 'purchase' | 'rental';
export type Template = 'modern' | 'standard_gst' | 'detailed_gst' | 'pos' | 'pos_kot' | 'kot' | 'booking_voucher' | 'purchase' | 'rental';

/** GET /host/receipts/:kind/:id and /guest/receipts/:kind/:id (money in paise). */
export interface Receipt {
  kind: ReceiptKind; id: string; template: Template;
  business: { company?: string; logo?: string; name: string; terms_title?: string; terms?: string; address?: string; city?: string; gstin?: string; phone?: string; upi_id?: string; currency?: string; language?: string; timezone?: string; price_decimals?: number; qty_decimals?: number };
  number: string; date: string; party?: string; phone?: string;
  lines: { name: string; qty: number; rate_minor: number; tax_pct: number; amount_minor: number }[];
  subtotal_minor: number; tax_breakup: { label: string; amount_minor: number }[]; total_minor: number;
  paid_via?: string; status: string; qr_payload: string; meta?: Record<string, string>;
  show?: ReceiptShow;
}
/** Blocks a receipt can show (hosts choose; guests get them already applied). */
export interface ReceiptShow { company: boolean; business: boolean; logo: boolean; address: boolean; gstin: boolean; terms: boolean }
export interface ReceiptRow { kind: ReceiptKind; id: string; number: string; party?: string; total_minor: number; status: string; created_at: string }

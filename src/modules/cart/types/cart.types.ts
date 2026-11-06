/** A cart line: a catalogue item (ordered) or a resource booking (table, room, bay, slot…). Money in paise. */
export interface CartLine {
  /** Unique per line: item id, or `${resourceId}@${from}` for bookings. */
  key: string;
  id: string;
  kind: 'item' | 'resource';
  type: string;
  name: string;
  icon?: string;
  price_minor: number;
  qty: number;
  /** Bookings only: ISO window and a human summary ("12 Oct · 7:00 PM · 2 guests"). */
  from?: string;
  to?: string;
  detail?: string;
  /** Bookings only: party size, sent with the booking. */
  guests?: number;
}

export type NewCartLine = Omit<CartLine, 'qty' | 'key'> & { key?: string };

export interface CartTotals { total: number; count: number }

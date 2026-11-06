import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartLine, CartTotals, NewCartLine } from '../types/cart.types';

export const MAX_QTY = 10_000;

// Persisted (localStorage) so a reload or a trip through Razorpay keeps it. A cart belongs to one business:
// adding from another business replaces it (the UI confirms first via `belongsElsewhere`).
interface CartState {
  businessId: string | null;
  businessName: string | null;
  lines: CartLine[];
  add: (line: NewCartLine, qty?: number, business?: { id: string; name: string }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const clampQty = (q: number) => Math.max(1, Math.min(MAX_QTY, Math.round(q)));
export const lineKey = (l: NewCartLine) => l.key ?? (l.kind === 'resource' && l.from ? `${l.id}@${l.from}` : l.id);

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      businessId: null,
      businessName: null,
      lines: [],
      add: (line, qty = 1, business) => set((s) => {
        const switching = !!business && !!s.businessId && s.businessId !== business.id;
        const lines = switching ? [] : s.lines;
        const key = lineKey(line);
        const ex = lines.find((l) => l.key === key);
        // A booking is one slot: re-adding replaces it rather than doubling it.
        const next = ex
          ? lines.map((l) => (l.key === key ? (l.kind === 'resource' ? { ...l, ...line, key } : { ...l, qty: clampQty(l.qty + qty) }) : l))
          : [...lines, { ...line, key, qty: line.kind === 'resource' ? 1 : clampQty(qty) }];
        return { lines: next, businessId: business?.id ?? s.businessId, businessName: business?.name ?? s.businessName };
      }),
      setQty: (key, qty) => set((s) => ({ lines: s.lines.map((l) => (l.key === key && l.kind === 'item' ? { ...l, qty: clampQty(qty) } : l)) })),
      remove: (key) => set((s) => {
        const lines = s.lines.filter((l) => l.key !== key);
        return lines.length ? { lines } : { lines, businessId: null, businessName: null };
      }),
      clear: () => set({ lines: [], businessId: null, businessName: null }),
    }),
    { name: 'ss.cart', version: 2, storage: createJSONStorage(() => localStorage), partialize: (s) => ({ businessId: s.businessId, businessName: s.businessName, lines: s.lines }) },
  ),
);

/** Sum of line amounts in paise (before tax). */
export const cartTotal = (lines: Pick<CartLine, 'price_minor' | 'qty'>[]) => lines.reduce((s, l) => s + l.price_minor * l.qty, 0);

/** Total and item count. Prices are what the business charges (taxes included); the server prices every line again. */
export function cartTotals(lines: Pick<CartLine, 'price_minor' | 'qty'>[]): CartTotals {
  const total = cartTotal(lines);
  return { total, count: lines.reduce((s, l) => s + l.qty, 0) };
}

/** True when the cart holds lines from a different business than `businessId`. */
export const belongsElsewhere = (businessId: string) => {
  const s = useCartStore.getState();
  return s.lines.length > 0 && !!s.businessId && s.businessId !== businessId;
};

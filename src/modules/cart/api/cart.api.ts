import { api } from '../../../services/api-client';
import type { CartLine } from '../types/cart.types';

export interface PlacedOrder { id: string; status: string; total_minor: number }

export const cartApi = {
  /** Items only; the server prices every line. `resourceId` ties the order to the scanned table/room/counter. */
  placeOrder: (businessId: string, resourceId: string | null, lines: CartLine[], idempotencyKey: string, paymentMode: 'online' | 'venue' = 'online') =>
    api.post<PlacedOrder>('/guest/orders', {
      business_id: businessId, resource_id: resourceId || undefined, kind: 'food', lines: lines.map((l) => ({ item_id: l.id, qty: l.qty })), payment_mode: paymentMode,
    }, { idempotencyKey }),
};

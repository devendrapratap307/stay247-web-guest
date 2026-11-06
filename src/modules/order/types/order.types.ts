export type OrderStatus = 'pending' | 'placed' | 'accepted' | 'preparing' | 'ready' | 'served' | 'cancelled';
export interface OrderLine { item_id?: string; name: string; qty: number; unit_price_minor: number }
/** GET /guest/orders: my orders at every business. */
export interface Order {
  id: string; number?: string; business_id?: string; business_name?: string; kind: string; status: OrderStatus; total_minor: number; created_at: string; lines: OrderLine[];
  /** host | online | venue; pending until paid (online) or confirmed by the place (venue, before `confirm_by`) */
  payment_mode?: 'host' | 'online' | 'venue'; confirm_by?: string; paid_at?: string;
}

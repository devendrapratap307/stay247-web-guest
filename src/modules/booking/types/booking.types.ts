export interface Booking {
  id: string;
  resource_id: string;
  booking_type: string;
  from: string;
  to: string;
  status: string;
  amount_minor: number;
  /** v2 list (GET /guest/bookings) adds these. */
  number?: string;
  business_name?: string;
  resource_name?: string;
  created_at?: string;
  /** host | online | venue; a pending venue booking is cancelled if the place has not confirmed it by `confirm_by` */
  payment_mode?: PaymentMode;
  confirm_by?: string;
}

/** How a guest pays: online in the app, or at the venue (the place must confirm in time). */
export type PaymentMode = 'host' | 'online' | 'venue';

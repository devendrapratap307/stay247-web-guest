import { api } from '../../../services/api-client';
import type { Page } from '../../../types/pagination.types';
import type { Booking, PaymentMode } from '../types/booking.types';

export interface GuestBookingBody { business_id: string; resource_id: string; booking_type: string; from: string; to: string; guests?: number; guest_name?: string; guest_phone?: string; payment_mode?: PaymentMode }

type Raw = Booking & { amount?: number; total?: number; amount_paise?: number };
const norm = (b: Raw): Booking => ({ ...b, amount_minor: b.amount_minor ?? b.amount_paise ?? b.total ?? b.amount ?? 0 });

export const bookingApi = {
  // Guests never send an amount: the server prices the booking.
  create: (b: GuestBookingBody, key: string) => api.post<Booking>('/guest/bookings', b, { idempotencyKey: key }),
  async mine(cursor = 0, limit = 20): Promise<Page<Booking>> {
    const p = await api.list<Raw>('/guest/bookings', { cursor, limit });
    return { ...p, items: p.items.map(norm) };
  },
};

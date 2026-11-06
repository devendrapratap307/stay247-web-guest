import { api } from '../../../services/api-client';
import { bookingPayRequestSchema, paymentIntentSchema, payRequestSchema } from '../schemas/payment.schema';
import type { PaymentIntent } from '../types/payment.types';

export const paymentApi = {
  /** The amount always comes from the server's order total, never from the browser. */
  async create(orderId: string, idempotencyKey: string): Promise<PaymentIntent> {
    payRequestSchema.parse({ order_id: orderId });
    return paymentIntentSchema.parse(await api.post<PaymentIntent>('/guest/payments', { order_id: orderId }, { idempotencyKey }));
  },
  /** Confirms the checkout callback on the server (signature check); the payment is marked paid right away. */
  verify: (b: { provider_order_id: string; provider_payment_id: string; signature: string }) =>
    api.post<{ payment_id: string; status: string; purpose: string; ref_id?: string }>('/guest/payments/verify', b),
  /** Booking advance / deposit (POST /guest/payments with booking_id). */
  async createForBooking(bookingId: string, idempotencyKey: string): Promise<PaymentIntent> {
    bookingPayRequestSchema.parse({ booking_id: bookingId });
    return paymentIntentSchema.parse(await api.post<PaymentIntent>('/guest/payments', { booking_id: bookingId }, { idempotencyKey }));
  },
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { ApiError } from '../../../services/api-error';
import { useTenantStore } from '../../../stores/tenant.store';
import { toast } from '../../../stores/ui.store';
import { newIdempotencyKey } from '../../../utils/format.utils';
import { authApi } from '../../auth/api/auth.api';
import type { Me } from '../../auth/types/auth.types';
import { bookingApi } from '../../booking/api/booking.api';
import type { Booking } from '../../booking/types/booking.types';
import { startPayment } from '../../payment/hooks/useRazorpayCheckout';
import type { PayOutcome } from '../../payment/types/payment.types';
import { cartApi, type PlacedOrder } from '../api/cart.api';
import { cartSchema, type CheckoutForm } from '../schemas/cart.schema';
import type { CheckoutResult } from './useCheckoutStep';
import { cartTotals, useCartStore } from './useCartStore';

export const shortRef = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase();

/**
 * Places the cart: items become one order, each booked resource a booking (one idempotency key per attempt, so a retry
 * after a network error never double-books). Then pays online via Razorpay unless "Pay at venue" was chosen.
 */
export function useCheckout() {
  const qc = useQueryClient();
  const key = useRef(newIdempotencyKey());
  return useMutation({
    meta: { silent: true },
    mutationFn: async (v: CheckoutForm): Promise<CheckoutResult> => {
      const cart = useCartStore.getState();
      const tenant = useTenantStore.getState();
      const businessId = cart.businessId ?? tenant.businessId;
      if (!cart.lines.length) throw new Error('Your cart is empty');
      if (!businessId) throw new Error('Choose a place first');

      // Keep the account's name / phone current (used by the business for this booking). Never blocks checkout.
      const me = qc.getQueryData<Me>(['me']);
      const phone = v.phone.replace(/\D/g, '').slice(-10);
      if (me && (me.name !== v.name || me.phone !== phone)) {
        await authApi.updateMe({ name: v.name, phone }).then((m) => qc.setQueryData(['me'], m)).catch(() => undefined);
      }

      // pay at venue: the place must confirm in time (business setting) or it is cancelled; online: waits for the payment
      const paymentMode = v.method === 'venue' ? 'venue' : 'online';
      const items = cart.lines.filter((l) => l.kind === 'item');
      const resources = cart.lines.filter((l) => l.kind === 'resource');
      let order: PlacedOrder | undefined;
      if (items.length) {
        const parsed = cartSchema.safeParse({ lines: items.map((l) => ({ item_id: l.id, qty: l.qty })) });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
        order = await cartApi.placeOrder(businessId, tenant.businessId === businessId ? tenant.resourceId : null, items, key.current, paymentMode);
      }
      const bookings: Booking[] = [];
      for (const [i, l] of resources.entries()) {
        bookings.push(await bookingApi.create({ business_id: businessId, resource_id: l.id, booking_type: l.type, from: l.from!, to: l.to!, guests: l.guests, guest_name: v.name, guest_phone: phone, payment_mode: paymentMode }, `${key.current}-b${i}`));
      }

      const total = cartTotals(cart.lines).total;
      key.current = newIdempotencyKey();
      useCartStore.getState().clear();
      void qc.invalidateQueries({ queryKey: ['my-orders'] });
      void qc.invalidateQueries({ queryKey: ['my-bookings'] });

      let paid = false;
      if (v.method !== 'venue') {
        const prefill = { name: v.name, contact: phone, email: me?.email, method: v.method };
        const outcomes: PayOutcome[] = [];
        if (order) outcomes.push(await startPayment({ orderId: order.id, prefill }, qc).catch(() => 'dismissed' as const));
        for (const b of bookings) {
          outcomes.push(await startPayment({ bookingId: b.id, prefill }, qc).catch(() => {
            toast.info('Online payment is not available for this booking. Please pay at the venue.');
            return 'disabled' as const;
          }));
        }
        paid = outcomes.length > 0 && outcomes.every((o) => o === 'paid');
      }
      const first = order?.id ?? bookings[0]!.id;
      return {
        ref: bookings[0]?.number ?? `SS-${shortRef(first)}`,
        orderId: order?.id,
        bookingIds: bookings.map((b) => b.id),
        pass: `SS:${order ? 'ORDER' : 'BOOKING'}:${first}`,
        // What the server actually charged (it re-prices every line and booking).
        total_minor: (order?.total_minor ?? 0) + bookings.reduce((s, b) => s + b.amount_minor, 0) || total,
        paid,
        method: v.method,
        hasBookings: bookings.length > 0,
      };
    },
  });
}

/** Human message for checkout failures (409 = slot taken while the guest was deciding). */
export function checkoutError(e: unknown): string {
  if (e instanceof ApiError && e.status === 409) return 'That slot was just taken. Remove it and pick another time.';
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return 'Something went wrong. Please try again.';
}

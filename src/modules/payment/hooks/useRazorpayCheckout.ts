import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { APP_NAME } from '../../../config/constants';
import { confirmAction, toast } from '../../../stores/ui.store';
import { newIdempotencyKey } from '../../../utils/format.utils';
import { paymentApi } from '../api/payment.api';
import type { PaymentIntent, PayOutcome, RazorpayOptions } from '../types/payment.types';

let loading: Promise<void> | null = null;
/** Loads Razorpay's checkout script on demand (allowed by this app's CSP only). */
function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => { loading = null; reject(new Error('Could not load the payment window. Check your connection.')); };
    document.head.appendChild(s);
  });
  return loading;
}

function openCheckout(intent: PaymentIntent, prefill: RazorpayOptions['prefill'], onPaid: () => void): Promise<PayOutcome> {
  return new Promise((resolve) => {
    const rz = new window.Razorpay!({
      key: intent.key_id, order_id: intent.provider_order_id, amount: intent.amount_minor, currency: intent.currency, name: APP_NAME, prefill,
      // The server checks the signature and marks the payment paid; the webhook remains the backstop.
      handler: (r) => {
        paymentApi.verify({ provider_order_id: r.razorpay_order_id, provider_payment_id: r.razorpay_payment_id, signature: r.razorpay_signature })
          .catch(() => undefined)
          .finally(() => { onPaid(); resolve('paid'); });
      },
      modal: { ondismiss: () => { toast.info('Payment cancelled'); resolve('dismissed'); } },
    });
    rz.on('payment.failed', (r) => toast.error(r.error?.description ?? 'Payment failed. You can try again.'));
    rz.open();
  });
}

export interface PayVars { orderId?: string; bookingId?: string; prefill?: RazorpayOptions['prefill'] }

/** Creates the payment intent and opens Razorpay. Resolves 'paid' only after the handler fires (the webhook confirms it). */
export async function startPayment(v: string | PayVars, qc: QueryClient): Promise<PayOutcome> {
  const p: PayVars = typeof v === 'string' ? { orderId: v } : v;
  const key = newIdempotencyKey();
  const intent = p.bookingId ? await paymentApi.createForBooking(p.bookingId, key) : await paymentApi.create(p.orderId!, key);
  if (!intent.key_id) {
    // Local development without Razorpay keys: the backend accepts a simulated payment only when it has no keys either.
    if (!(await confirmAction({ title: 'Simulate payment?', message: 'Online payments are not configured here. Mark this test payment as paid?', confirmLabel: 'Simulate payment' }))) return 'dismissed';
    await paymentApi.verify({ provider_order_id: intent.provider_order_id, provider_payment_id: `pay_dev_${Date.now()}`, signature: 'dev_ok' });
    [800, 2500].forEach((ms) => setTimeout(() => { void qc.invalidateQueries({ queryKey: ['my-orders'] }); void qc.invalidateQueries({ queryKey: ['my-bookings'] }); }, ms));
    return 'paid';
  }
  await loadScript();
  return openCheckout(intent, p.prefill, () => {
    toast.success('Payment received. Confirming…');
    // The webhook can arrive a moment later; refresh a few times.
    [1500, 4000, 9000].forEach((ms) => setTimeout(() => {
      void qc.invalidateQueries({ queryKey: ['my-orders'] });
      void qc.invalidateQueries({ queryKey: ['my-bookings'] });
    }, ms));
  });
}

/** Opens Razorpay for an order (or a booking). Accepts a bare order id for the "Pay now" buttons. */
export function usePay() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: string | PayVars) => startPayment(v, qc) });
}

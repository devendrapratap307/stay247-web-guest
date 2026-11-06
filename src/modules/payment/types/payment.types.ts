export interface PaymentIntent { payment_id: string; provider_order_id: string; amount_minor: number; currency: string; key_id: string }

/** Online methods offered in the checkout panel; 'venue' means pay at the counter (no online payment). */
export type PayMethod = 'upi' | 'card' | 'venue';
export type PayOutcome = 'paid' | 'dismissed' | 'disabled';

export interface RazorpaySuccess { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
export interface RazorpayOptions {
  key: string; order_id: string; amount: number; currency: string; name: string; description?: string;
  handler: (r: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { email?: string; name?: string; contact?: string; method?: 'upi' | 'card' };
}
declare global { interface Window { Razorpay?: new (o: RazorpayOptions) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void } } }

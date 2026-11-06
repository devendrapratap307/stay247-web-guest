import { create } from 'zustand';

/** Outcome shown on the confirmation card (ref + QR pass). */
export interface CheckoutResult {
  ref: string;
  orderId?: string;
  bookingIds: string[];
  /** Encoded in the QR pass the guest shows at the counter. */
  pass: string;
  total_minor: number;
  paid: boolean;
  method: 'upi' | 'card' | 'venue';
  hasBookings: boolean;
}

export type CheckoutStep = 'cart' | 'pay' | 'done';

// Shared by the side panel and the mobile cart page so a booking sheet can jump straight to payment.
interface StepState { step: CheckoutStep; result: CheckoutResult | null; go: (s: CheckoutStep) => void; finish: (r: CheckoutResult) => void; reset: () => void }

export const useCheckoutStep = create<StepState>((set) => ({
  step: 'cart',
  result: null,
  go: (step) => set({ step }),
  finish: (result) => set({ step: 'done', result }),
  reset: () => set({ step: 'cart', result: null }),
}));

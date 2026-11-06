import { z } from 'zod';
import { v } from '../../../utils/validation.utils';

export const cartSchema = z.object({ lines: z.array(z.object({ item_id: z.string().uuid(), qty: v.qty })).min(1, 'Your cart is empty').max(100) });

const checkoutBase = z.object({
  name: v.name('Name'),
  phone: z.string().trim().min(1, 'Phone is required').refine((p) => /^(\+?91|0)?[6-9]\d{9}$/.test(p.replace(/[\s()-]/g, '')), 'Enter a valid 10-digit mobile number'),
  method: z.enum(['upi', 'card', 'venue']),
});
export type CheckoutForm = z.infer<typeof checkoutBase>;

/** Checkout details (the licence for rentals is checked by the host at pickup). */
export const checkoutSchema = () => checkoutBase;

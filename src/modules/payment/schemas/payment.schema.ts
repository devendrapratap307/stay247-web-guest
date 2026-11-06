import { z } from 'zod';

export const payRequestSchema = z.object({ order_id: z.string().uuid('Invalid order') });
export const bookingPayRequestSchema = z.object({ booking_id: z.string().uuid('Invalid booking') });
export const paymentIntentSchema = z.object({
  payment_id: z.string(), provider_order_id: z.string().min(1), amount_minor: z.number().int().positive(), currency: z.string().length(3), key_id: z.string(),
});

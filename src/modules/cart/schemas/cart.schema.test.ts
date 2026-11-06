import { describe, expect, it } from 'vitest';
import { checkoutSchema } from './cart.schema';

const base = { name: 'Priya Sharma', method: 'upi' as const };
const ok = (phone: string) => checkoutSchema().safeParse({ ...base, phone }).success;

describe('checkout phone', () => {
  it('accepts common Indian mobile formats', () => {
    for (const p of ['9810000000', '+91 98100 00000', '+91-98100-00000', '098100 00000', '91 9810000000']) expect(ok(p), p).toBe(true);
  });
  it('rejects short, landline-like or empty numbers', () => {
    for (const p of ['', '98100', '1234567890', '+1 555 010 9999']) expect(ok(p), p).toBe(false);
  });
});

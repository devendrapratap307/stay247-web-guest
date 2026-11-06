import { describe, expect, it } from 'vitest';
import { v } from './validation.utils';

describe('validation building blocks', () => {
  it('accepts a valid email and rejects a bad one with a clear message', () => {
    expect(v.email.safeParse('a@b.com').success).toBe(true);
    const r = v.email.safeParse('nope');
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Enter a valid email address');
  });
  it('requires a 6-digit otp', () => {
    expect(v.otp.safeParse('123456').success).toBe(true);
    expect(v.otp.safeParse('12345').success).toBe(false);
    expect(v.otp.safeParse('12a456').success).toBe(false);
  });
  it('rejects negative money and zero quantity', () => {
    expect(v.money.safeParse(-1).success).toBe(false);
    expect(v.qty.safeParse(0).success).toBe(false);
    expect(v.qty.safeParse('2').success).toBe(true);
  });
});

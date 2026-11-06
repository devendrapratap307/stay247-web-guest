import { describe, expect, it } from 'vitest';
import { bookingPrice, ruleFor } from './booking-rules';

describe('rental rule from a card', () => {
  it('counts hours, days or nights by the vehicle price unit', () => {
    expect(ruleFor('rental', { price_unit: 'hour' }).unit?.word).toBe('hr');
    expect(ruleFor('rental', { price_unit: 'day' }).unit?.word).toBe('day');
    expect(ruleFor('rental', { price_unit: 'night' }).unit?.word).toBe('night');
    expect(ruleFor('rental', {}).unit?.word).toBe('hr');
    expect(ruleFor('rental', { price_unit: 'day' }).minutes(2)).toBe(2 * 24 * 60);
    expect(bookingPrice(ruleFor('rental', { price_unit: 'hour' }), 10000, 4)).toBe(40000);
  });
  it('a flat rental is one charge', () => {
    const r = ruleFor('rental', { price_unit: 'flat' });
    expect(r.pricing).toBe('fixed');
    expect(bookingPrice(r, 50000, 3)).toBe(50000);
  });
});

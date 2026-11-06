import { describe, expect, it } from 'vitest';
import { nextHourLocal, rentalEnd, rentalPrice } from './rental';

const from = new Date('2026-10-24T10:00:00Z');

describe('rentalPrice', () => {
  it('charges started hours for hourly rates', () => {
    expect(rentalPrice(5000, 'hour', from, new Date('2026-10-24T12:30:00Z'))).toBe(15000);
  });
  it('charges started days for day rates', () => {
    expect(rentalPrice(80000, 'day', from, new Date('2026-10-25T11:00:00Z'))).toBe(160000);
  });
  it('charges flat rates once and nothing for an empty window', () => {
    expect(rentalPrice(9900, 'flat', from, rentalEnd(from, 3, 'weeks'))).toBe(9900);
    expect(rentalPrice(9900, 'hour', from, from)).toBe(0);
  });
});

describe('rentalEnd / nextHourLocal', () => {
  it('adds whole units', () => {
    expect(rentalEnd(from, 2, 'days').toISOString()).toBe('2026-10-26T10:00:00.000Z');
  });
  it('rounds up to the next hour', () => {
    expect(nextHourLocal(new Date(2026, 9, 24, 9, 41))).toBe('2026-10-24T10:00');
  });
});

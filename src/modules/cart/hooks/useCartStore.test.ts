import { beforeEach, describe, expect, it } from 'vitest';
import { cartTotal, cartTotals, useCartStore } from './useCartStore';

describe('cart store', () => {
  beforeEach(() => useCartStore.getState().clear());
  it('merges repeated adds and totals correctly', () => {
    const { add } = useCartStore.getState();
    add({ id: 'a', kind: 'item', type: 'food', name: 'Tea', price_minor: 2000 });
    add({ id: 'a', kind: 'item', type: 'food', name: 'Tea', price_minor: 2000 }, 2);
    add({ id: 'b', kind: 'item', type: 'food', name: 'Cake', price_minor: 5000 });
    const { lines } = useCartStore.getState();
    expect(lines).toHaveLength(2);
    expect(lines[0]?.qty).toBe(3);
    expect(cartTotal(lines)).toBe(11000);
  });
  it('clamps quantity and removes lines', () => {
    const s = useCartStore.getState();
    s.add({ id: 'a', kind: 'item', type: 'food', name: 'Tea', price_minor: 100 });
    s.setQty('a', 0);
    expect(useCartStore.getState().lines[0]?.qty).toBe(1);
    s.setQty('a', 99999);
    expect(useCartStore.getState().lines[0]?.qty).toBe(10000);
    s.remove('a');
    expect(useCartStore.getState().lines).toHaveLength(0);
  });
  it('keeps one line per booked slot and starts a new cart for another business', () => {
    const s = useCartStore.getState();
    const room = { id: 'r', kind: 'resource' as const, type: 'room', name: 'Room 204', price_minor: 450000, from: '2026-10-12T08:30:00Z', to: '2026-10-13T05:30:00Z' };
    s.add(room, 1, { id: 'b1', name: 'Grand' });
    s.add(room, 1, { id: 'b1', name: 'Grand' });
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(cartTotals(useCartStore.getState().lines)).toEqual({ total: 450000, count: 1 });
    s.add({ id: 'x', kind: 'item', type: 'food', name: 'Tea', price_minor: 100 }, 1, { id: 'b2', name: 'Cafe' });
    expect(useCartStore.getState().lines.map((l) => l.id)).toEqual(['x']);
    expect(useCartStore.getState().businessId).toBe('b2');
  });
});

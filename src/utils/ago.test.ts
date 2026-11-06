import { describe, expect, it } from 'vitest';
import { ago } from './ago';

describe('ago', () => {
  const now = 1_700_000_000_000;
  it.each([
    [0, ''], [now - 2_000, 'just now'], [now - 25_000, '25s ago'], [now - 3 * 60_000, '3 min ago'],
    [now - 2 * 3_600_000, '2 h ago'], [now - 50 * 3_600_000, '2 d ago'], [now + 5_000, 'just now'],
  ])('%i → %s', (at, out) => expect(ago(at, now)).toBe(out));
});

describe('ago in Hindi', () => {
  it('uses Hindi words', () => {
    expect(ago(1_000_000 - 3 * 60_000, 1_000_000, 'hi')).toBe('3 मिनट पहले');
    expect(ago(1_000_000, 1_000_000, 'hi')).toBe('अभी');
  });
});

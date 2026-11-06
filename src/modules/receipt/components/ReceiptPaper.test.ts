import { describe, expect, it } from 'vitest';
import { inWords } from './ReceiptPaper';

describe('inWords (Indian numbering)', () => {
  it.each([
    [0, 'Zero'], [5964, 'Five Thousand Nine Hundred Sixty Four'], [100000, 'One Lakh'],
    [12345678, 'One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight'], [18, 'Eighteen'],
  ])('%i → %s', (n, w) => expect(inWords(n)).toBe(w));
});

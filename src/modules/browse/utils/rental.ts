/** Duration units the rental search offers, in hours. */
export const DURATION_UNITS = [
  { code: 'hours', label: 'Hours', hours: 1 },
  { code: 'days', label: 'Days', hours: 24 },
  { code: 'weeks', label: 'Weeks', hours: 24 * 7 },
] as const;
export type DurationUnit = (typeof DURATION_UNITS)[number]['code'];

const HOUR = 3_600_000;

/** Mirrors the server's booking.Price: hour → ceil(hours), day/night → ceil(days), anything else → flat. Paise. */
export function rentalPrice(priceMinor: number, unit: string | undefined, from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  if (ms <= 0 || priceMinor <= 0) return 0;
  const n = unit === 'hour' ? Math.ceil(ms / HOUR) : unit === 'day' || unit === 'night' ? Math.ceil(ms / (24 * HOUR)) : 1;
  return priceMinor * n;
}

/** Return time for a pickup plus `qty` × unit. */
export function rentalEnd(from: Date, qty: number, unit: DurationUnit): Date {
  const h = DURATION_UNITS.find((u) => u.code === unit)!.hours;
  return new Date(from.getTime() + Math.max(1, qty) * h * HOUR);
}

/** Next full hour, as a `datetime-local` value in local time. */
export function nextHourLocal(now = new Date()): string {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`;
}

// How each bookable type turns "date + slot + units" into a from/to window and a price estimate (the server prices it).
export interface BookingRule {
  dateLabel: string;
  /** Units the guest adjusts (nights, hours, guests…); omitted when there is nothing to count. */
  unit?: { label: string; word: string; min: number; step: number; initial: number };
  /** per_unit: price × units (rooms, parking); fixed: one charge (deposit, fee, hall). */
  pricing: 'per_unit' | 'fixed';
  fixedLabel?: string;
  slotLabel?: string;
  slots?: string[];
  /** Length of one booking in minutes, given the units. */
  minutes: (units: number, slot?: string) => number;
  /** Rooms: check-in/out times instead of slots. */
  stay?: { checkIn: string; checkOut: string };
}

const SESSIONS: Record<string, [string, number]> = { Morning: ['09:00', 6 * 60], Evening: ['17:00', 6 * 60] };

export const BOOKING_RULES: Record<string, BookingRule> = {
  room: { dateLabel: 'Check-in date', pricing: 'per_unit', unit: { label: 'Nights', word: 'night', min: 1, step: 1, initial: 1 }, stay: { checkIn: '14:00', checkOut: '11:00' }, minutes: (n) => n * 24 * 60 },
  parking: { dateLabel: 'Entry date', pricing: 'per_unit', unit: { label: 'Duration (hours)', word: 'hr', min: 1, step: 1, initial: 2 }, slotLabel: 'Entry time', slots: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'], minutes: (n) => n * 60 },
  venue: { dateLabel: 'Event date', pricing: 'fixed', fixedLabel: 'Hall charges', unit: { label: 'Guests', word: 'guests', min: 10, step: 10, initial: 100 }, slotLabel: 'Session', slots: ['Morning', 'Evening'], minutes: (_n, s) => SESSIONS[s ?? '']?.[1] ?? 360 },
  table: { dateLabel: 'Date', pricing: 'fixed', fixedLabel: 'Booking deposit', unit: { label: 'Party size', word: 'guests', min: 1, step: 1, initial: 2 }, slotLabel: 'Time slot', slots: ['19:00', '20:00', '21:00'], minutes: () => 90 },
  appt: { dateLabel: 'Date', pricing: 'fixed', fixedLabel: 'Consultation fee', slotLabel: 'Available slots', slots: ['10:30', '11:00', '11:30', '16:00'], minutes: () => 30 },
};

export const DEFAULT_RULE: BookingRule = { dateLabel: 'Date', pricing: 'fixed', fixedLabel: 'Booking charge', slotLabel: 'Time', slots: ['09:00', '12:00', '15:00', '18:00'], minutes: () => 60 };

const PICKUP = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
/** Rentals booked from a card: the vehicle's price unit decides what the guest counts (hours, days, nights) or a flat charge. */
const RENTAL_RULES: Record<string, BookingRule> = {
  hour: { dateLabel: 'Pickup date', pricing: 'per_unit', unit: { label: 'Duration (hours)', word: 'hr', min: 1, step: 1, initial: 4 }, slotLabel: 'Pickup time', slots: PICKUP, minutes: (n) => n * 60 },
  day: { dateLabel: 'Pickup date', pricing: 'per_unit', unit: { label: 'Days', word: 'day', min: 1, step: 1, initial: 1 }, slotLabel: 'Pickup time', slots: PICKUP, minutes: (n) => n * 24 * 60 },
  night: { dateLabel: 'Pickup date', pricing: 'per_unit', unit: { label: 'Nights', word: 'night', min: 1, step: 1, initial: 1 }, slotLabel: 'Pickup time', slots: PICKUP, minutes: (n) => n * 24 * 60 },
  flat: { dateLabel: 'Pickup date', pricing: 'fixed', fixedLabel: 'Rental charge', slotLabel: 'Pickup time', slots: PICKUP, minutes: () => 24 * 60 },
};

/** Rule for a type; a resource's `meta.slots` (string[]) overrides the default slots. */
export function ruleFor(type: string, meta?: Record<string, unknown>): BookingRule {
  const unit = typeof meta?.price_unit === 'string' ? meta.price_unit : '';
  const base = type === 'rental' ? RENTAL_RULES[unit] ?? RENTAL_RULES.hour! : BOOKING_RULES[type] ?? DEFAULT_RULE;
  const slots = Array.isArray(meta?.slots) ? (meta.slots as unknown[]).filter((s): s is string => typeof s === 'string') : null;
  return slots?.length ? { ...base, slots } : base;
}

const at = (date: string, hhmm: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
};

/** Local date (YYYY-MM-DD) + slot + units → booking window. */
export function bookingWindow(rule: BookingRule, date: string, slot: string | undefined, units: number): { from: Date; to: Date } {
  if (rule.stay) {
    const from = at(date, rule.stay.checkIn);
    const to = at(date, rule.stay.checkOut);
    to.setDate(to.getDate() + Math.max(1, units));
    return { from, to };
  }
  const time = SESSIONS[slot ?? '']?.[0] ?? (slot && /^\d{1,2}:\d{2}$/.test(slot) ? slot : rule.slots?.[0] ?? '09:00');
  const from = at(date, time);
  return { from, to: new Date(from.getTime() + rule.minutes(units, slot) * 60_000) };
}

/** Client-side estimate in paise (shown before checkout; the server's price is final). */
export const bookingPrice = (rule: BookingRule, priceMinor: number, units: number) =>
  rule.pricing === 'per_unit' ? priceMinor * Math.max(1, units) : priceMinor;

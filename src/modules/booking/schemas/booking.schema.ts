import { z } from 'zod';

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** Booking sheet: a local date plus the computed start, which must be in the future. */
export const bookingSheetSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date').refine((d) => d >= today(), 'Choose today or a later date'),
  from: z.date().refine((d) => d.getTime() > Date.now(), 'That time has passed. Pick a later slot.'),
  units: z.number().int().min(1).max(10_000),
});
export { today as todayIso };

import type { BookingTypeView } from '../config/booking-types';

/** Horizontal, scrollable booking-type chips (icon + label); the active one is highlighted. */
export function CategoryChips({ types, value, onChange }: { types: BookingTypeView[]; value: string; onChange: (code: string) => void }) {
  return (
    <div className="chips" role="toolbar" aria-label="Booking type">
      {types.map((t) => (
        <button key={t.code} type="button" aria-pressed={t.code === value} onClick={() => onChange(t.code)}>
          <span aria-hidden>{t.icon}</span>{t.label}
        </button>
      ))}
    </div>
  );
}

// The 8 guest booking types from the prototype. Labels can be overridden by /app/bootstrap (DB-driven); icons and booking
// rules (units, slots, pricing) live here because they drive the UI.
export interface BookingTypeView { code: string; icon: string; label: string }

/** "All": everything a business offers (its items and every bookable resource) in one grid. */
export const ALL_TYPE: BookingTypeView = { code: 'all', icon: '🧭', label: 'All' };

export const DEFAULT_TYPES: BookingTypeView[] = [
  { code: 'food', icon: '🍕', label: 'Food' },
  { code: 'parking', icon: '🅿️', label: 'Parking' },
  { code: 'venue', icon: '🏛️', label: 'Venue' },
  { code: 'table', icon: '🍽️', label: 'Table' },
  { code: 'room', icon: '🛏️', label: 'Room' },
  { code: 'appt', icon: '🩺', label: 'Hospital' },
  { code: 'med', icon: '💊', label: 'Medical' },
  { code: 'shop', icon: '🛍️', label: 'Shop' },
  { code: 'rental', icon: '🔑', label: 'Rentals' },
];

/** Top-nav shortcuts (prototype: Stays, Food, Parking, Health, Shop). */
export const NAV_TYPES = [
  { code: 'room', key: 'nav.stays' },
  { code: 'food', key: 'nav.food' },
  { code: 'parking', key: 'nav.parking' },
  { code: 'appt', key: 'nav.health' },
  { code: 'shop', key: 'nav.shop' },
] as const;

/** Price suffix on cards. */
export const PRICE_UNIT: Record<string, string> = { room: '/ night', parking: '/ hr', venue: '/ event', table: 'deposit', appt: '/ visit', rental: '/ hr' };

/** Types where the 3D floor picker is shown. */
export const MAP_TYPES = new Set(['table', 'room']);

/** What a scanned QR lets the guest do (QR landing screen). */
export const QR_ACTIONS: Record<string, { verb: string; actions: string[] }> = {
  parking: { verb: 'parking booking', actions: ['Book this bay', 'Pay by the hour', 'Extend later from the app'] },
  venue: { verb: 'venue booking', actions: ['Check available dates', 'Pay advance to hold'] },
  room: { verb: 'room booking', actions: ['Book this room', 'See amenities and rates'] },
  table: { verb: 'table reservation', actions: ['Reserve this table', 'Pre-order food'] },
  food: { verb: 'the menu', actions: ['Browse the menu', 'Order to your table', 'Pay by UPI'] },
  appt: { verb: 'appointment booking', actions: ['Book an appointment', 'See doctors and slots', 'Book lab tests'] },
  rental: { verb: 'rental', actions: ['Pick dates and duration', 'Show your licence at pickup', 'Pay deposit and ride'] },
  med: { verb: 'the pharmacy', actions: ['Search medicines', 'Upload a prescription', 'Pickup or delivery'] },
  shop: { verb: 'the shop', actions: ['Browse items', 'Scan and pay', 'Pickup or delivery'] },
};

export const typeIcon = (code: string) => DEFAULT_TYPES.find((t) => t.code === code)?.icon ?? '📦';

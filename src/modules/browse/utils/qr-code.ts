import type { CatalogEntry, CatalogItem, Resolved } from '../types/browse.types';

const CODE_RE = /^[A-Za-z0-9_-]{4,64}$/;

/**
 * Extracts the StayServe code from whatever a scanner returns: a bare code ("Kx9P2mQa"), a deep link
 * ("https://stayserve.app/q/Kx9P2mQa"), a link with ?code= / ?qr=, or "stayserve:Kx9P2mQa". Returns null if it is not ours.
 */
export function parseQrCode(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (CODE_RE.test(s)) return s;
  const scheme = /^stayserve:(?:\/\/)?(?:q\/)?([^/?#]+)$/i.exec(s);
  if (scheme) return CODE_RE.test(scheme[1]!) ? scheme[1]! : null;
  let url: URL;
  try { url = new URL(s); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const param = url.searchParams.get('code') ?? url.searchParams.get('qr');
  if (param) return CODE_RE.test(param) ? param : null;
  const parts = url.pathname.split('/').filter(Boolean);
  const qi = parts.indexOf('q');
  const candidate = qi >= 0 ? parts[qi + 1] : undefined;
  return candidate && CODE_RE.test(candidate) ? decodeURIComponent(candidate) : null;
}

type Obj = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const nameOf = (v: unknown) => str(v) ?? (v && typeof v === 'object' ? str((v as Obj).name) : undefined);
const idOf = (v: unknown) => (v && typeof v === 'object' ? str((v as Obj).id) : undefined);

/** Accepts both the existing flat response and the v2 nested {company, business, location, resource, type}. */
export function normalizeResolved(raw: unknown, code: string): Resolved {
  const r = (raw ?? {}) as Obj;
  const business_id = str(r.business_id) ?? idOf(r.business);
  const resource_id = str(r.resource_id) ?? idOf(r.resource);
  if (!business_id || !resource_id) throw new Error('Unrecognised QR response');
  return {
    code,
    business_id,
    business_name: str(r.business_name) ?? nameOf(r.business) ?? 'Business',
    resource_id,
    resource_name: str(r.resource_name) ?? nameOf(r.resource) ?? 'Resource',
    type: str(r.booking_type) ?? str(r.type) ?? (r.resource && typeof r.resource === 'object' ? str((r.resource as Obj).type) : undefined) ?? 'food',
    company_name: str(r.company_name) ?? nameOf(r.company),
    location_name: str(r.location_name) ?? str(r.city) ?? nameOf(r.location),
    path: str(r.path),
    bookable: r.bookable === true,
    price_minor: typeof r.price_minor === 'number' ? r.price_minor : undefined,
    price_unit: str(r.price_unit),
  };
}

const money = (...v: unknown[]) => {
  for (const x of v) if (typeof x === 'number' && Number.isFinite(x)) return Math.round(x);
  return 0;
};

/** Catalog row → card. Money is integer paise (`price` per the contract; `price_minor`/`price_paise` also accepted). */
export function normalizeCatalog(rows: unknown[], type: string): CatalogEntry[] {
  return rows.map((x) => {
    const r = x as Obj;
    return {
      id: String(r.id),
      kind: r.kind === 'resource' ? 'resource' : 'item',
      type: str(r.type) ?? type,
      name: str(r.name) ?? 'Untitled',
      price_minor: money(r.price_minor, r.price_paise, r.price),
      image: str(r.image),
      available: r.available !== false,
      meta: r.meta && typeof r.meta === 'object' ? (r.meta as Obj) : {},
    };
  });
}

/** Legacy items endpoint → cards (used when the catalog endpoint is not deployed yet). */
export const fromLegacyItems = (rows: CatalogItem[], type: string): CatalogEntry[] =>
  rows.map((i) => ({ id: i.id, kind: 'item', type, name: i.name, price_minor: i.price_minor, available: i.kind !== 'goods' || i.stock > 0, meta: { unit_code: i.unit_code, stock: i.stock } }));

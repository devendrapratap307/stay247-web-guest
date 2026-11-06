/** Normalised QR resolution. The existing endpoint returns flat ids/names; contract v2 adds company and location. */
export interface Resolved {
  code: string;
  business_id: string;
  business_name: string;
  resource_id: string;
  resource_name: string;
  type: string;
  company_name?: string;
  location_name?: string;
  /** "Floor 2 › Room 204" */
  path?: string;
  bookable?: boolean;
  price_minor?: number;
  price_unit?: string;
}

/** Legacy catalogue row (GET /guest/businesses/:id/items). */
export interface CatalogItem { id: string; kind: string; name: string; unit_code: string; price_minor: number; stock: number }

/** One card in the browse grid (GET /guest/businesses/:id/catalog). Money in paise. */
export interface CatalogEntry {
  id: string;
  kind: 'item' | 'resource';
  type: string;
  name: string;
  price_minor: number;
  image?: string;
  available: boolean;
  meta: Record<string, unknown>;
}

/** A business the guest can browse (GET /guest/locations). */
export interface GuestLocation { business_id: string; name: string; city?: string; address?: string; company_id?: string; company_name?: string; types: string[]; distance_km?: number }

/** A host business (company) with listed locations (GET /guest/companies). */
export interface GuestCompany { company_id: string; name: string; locations: number; cities: string[] }

export type MapStatus = 'free' | 'busy' | 'held';
/** Floor-map node (GET /guest/businesses/:id/resources/map). */
export interface MapNode { id: string; name: string; type: string; parent_id: string | null; level: number; status: MapStatus }

/** What the guest picked to book (from a card, the 3D picker or a QR). */
export interface BookTarget { id: string; name: string; type: string; price_minor: number; meta?: Record<string, unknown>; viaQr?: boolean }

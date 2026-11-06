import { api } from '../../../services/api-client';
import { ApiError } from '../../../services/api-error';
import { useAuthStore } from '../../../stores/auth.store';
import type { CatalogEntry, CatalogItem, GuestCompany, GuestLocation, MapNode, Resolved } from '../types/browse.types';
import { fromLegacyItems, normalizeCatalog, normalizeResolved } from '../utils/qr-code';

const ITEM_TYPES = new Set(['food', 'med', 'shop']);

export const browseApi = {
  async resolve(code: string): Promise<Resolved> { return normalizeResolved(await api.get<unknown>(`/guest/qr/${encodeURIComponent(code)}`, undefined, { auth: useAuthStore.getState().signedIn }), code); },
  /** Public discovery: sent without a token when signed out. */
  locations: (q: string, type: string, company = '') =>
    api.get<GuestLocation[]>('/guest/locations', { q, type, company: company || undefined }, { auth: useAuthStore.getState().signedIn }).then((r) => r ?? []),
  /** Host businesses (companies) with listed locations offering `type`. */
  companies: (type: string) => api.get<GuestCompany[]>('/guest/companies', { type }, { auth: useAuthStore.getState().signedIn }).then((r) => r ?? []),
  /** What a place offers now: only what the host shows to guests and what is in stock / free; `all` adds the rest, marked unavailable. */
  async catalog(businessId: string, type: string, q: string, win?: { from: string; to: string }, all = false): Promise<CatalogEntry[]> {
    try {
      return normalizeCatalog((await api.get<unknown[]>(`/guest/businesses/${businessId}/catalog`, { type, q, from: win?.from, to: win?.to, all: all ? 1 : undefined }, { auth: useAuthStore.getState().signedIn })) ?? [], type);
    } catch (e) {
      // Older backends only have the items list; it covers the order-type catalogues (food, medical, shop).
      if (e instanceof ApiError && e.status === 404 && ITEM_TYPES.has(type)) return fromLegacyItems((await browseApi.items(businessId, q, 0, 100)).items, type);
      throw e;
    }
  },
  map: (businessId: string, type: string) => api.get<MapNode[]>(`/guest/businesses/${businessId}/resources/map`, { type }, { auth: useAuthStore.getState().signedIn }).then((r) => r ?? []),
  items: (businessId: string, q: string, cursor = 0, limit = 20) => api.list<CatalogItem>(`/guest/businesses/${businessId}/items`, { q, cursor, limit }),
};

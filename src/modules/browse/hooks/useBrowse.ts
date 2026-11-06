import { useMutation, useQuery } from '@tanstack/react-query';
import { SEARCH_DEBOUNCE_MS } from '../../../config/constants';
import { useDebounce } from '../../../hooks/useDebounce';
import { useTenantStore } from '../../../stores/tenant.store';
import { useBootstrap } from '../../appconfig';
import { useCartStore } from '../../cart/hooks/useCartStore';
import { browseApi } from '../api/browse.api';
import { DEFAULT_TYPES, type BookingTypeView } from '../config/booking-types';
import { parseQrCode } from '../utils/qr-code';

/**
 * Scanning resolves company › business › location › resource in one call. Scanning a different business clears the
 * old cart (a cart belongs to one business).
 */
export function useResolveCode() {
  return useMutation({
    mutationFn: (raw: string) => {
      const code = parseQrCode(raw);
      if (!code) throw new Error("This QR can't be used");
      return browseApi.resolve(code);
    },
    meta: { silent: true },
    onSuccess: (r) => {
      const t = useTenantStore.getState();
      const cart = useCartStore.getState();
      if (cart.businessId && cart.businessId !== r.business_id) cart.clear();
      t.setBusiness(r.business_id, r.business_name);
      t.setResource(r.resource_id, r.resource_name);
      t.setQr({ code: r.code, company: r.company_name, business: r.business_name, location: r.location_name, resource: r.resource_name, type: r.type });
    },
  });
}

/** Booking types for the chips: DB-driven labels (bootstrap) over the built-in 8 with icons. */
export function useBookingTypes(): BookingTypeView[] {
  const boot = useBootstrap();
  const fromDb = boot.data?.booking_types ?? [];
  if (!fromDb.length) return DEFAULT_TYPES;
  const known = new Map(DEFAULT_TYPES.map((t) => [t.code, t]));
  const merged = fromDb.map((b) => ({ code: b.code, label: b.label, icon: known.get(b.code)?.icon ?? b.icon ?? '📦' }));
  // Keep the built-in order; DB-only types go last.
  return [...DEFAULT_TYPES.filter((t) => merged.some((m) => m.code === t.code)).map((t) => merged.find((m) => m.code === t.code)!), ...merged.filter((m) => !known.has(m.code))];
}

/** Listed locations offering `type`; `company` keeps one host business's locations. */
export function useLocations(q: string, type: string, company = '', enabled = true) {
  const query = useDebounce(q, SEARCH_DEBOUNCE_MS);
  return useQuery({ queryKey: ['locations', query, type, company], queryFn: () => browseApi.locations(query, type, company), staleTime: 5 * 60_000, enabled });
}

/** Host businesses for the Business picker. */
export function useCompanies(type: string) {
  return useQuery({ queryKey: ['companies', type], queryFn: () => browseApi.companies(type), staleTime: 5 * 60_000 });
}

/** Browse grid of one place (public). `win` asks resource availability for that period (rentals); `all` keeps unavailable ones. */
export function useCatalog(businessId: string | null, type: string, search: string, win?: { from: string; to: string }, all = false) {
  const q = useDebounce(search, SEARCH_DEBOUNCE_MS);
  return useQuery({ queryKey: ['catalog', businessId, type, q, win?.from, win?.to, all], queryFn: () => browseApi.catalog(businessId!, type, q, win, all), enabled: !!businessId });
}

/** Floor map for the 3D picker; refreshed every 30 s so busy/free stays current. */
export function useResourceMap(businessId: string | null, type: string, enabled: boolean) {
  return useQuery({
    queryKey: ['resource-map', businessId, type],
    queryFn: () => browseApi.map(businessId!, type),
    enabled: enabled && !!businessId,
    refetchInterval: 30_000,
  });
}

import { create } from 'zustand';

// Which business the user is acting on (sent as X-Business-Id) and, for guests, the scanned resource and its QR context.
// Kept in sessionStorage: survives a reload, dies with the tab. Contains no secrets.
const KEY = 'ss.tenant';

/** Context resolved from a scanned QR: shown as "Company › Business › Location › Resource · via QR". */
export interface QrContext { code: string; company?: string; business: string; location?: string; resource: string; type: string }

interface Persisted {
  /** host business (company) picked in Browse; null = all businesses */
  companyId: string | null;
  businessId: string | null; businessName: string | null; resourceId: string | null; resourceName: string | null; qr: QrContext | null;
}
const empty: Persisted = { companyId: null, businessId: null, businessName: null, resourceId: null, resourceName: null, qr: null };

const load = (): Persisted => {
  try { return { ...empty, ...(JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Partial<Persisted>) }; } catch { return empty; }
};
const save = (p: Persisted) => { try { sessionStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage blocked */ } };

interface TenantState extends Persisted {
  /** Picking a business by hand drops any QR context that belonged to another business. */
  setBusiness: (id: string, name: string) => void;
  /** Narrows Browse to one host business (company); null shows every business. */
  setCompany: (id: string | null) => void;
  setResource: (id: string | null, name: string | null) => void;
  setQr: (qr: QrContext | null) => void;
  clear: () => void;
}

export const useTenantStore = create<TenantState>((set, get) => {
  const update = (patch: Partial<Persisted>) => {
    const next = { ...pick(get()), ...patch };
    save(next); set(next);
  };
  return {
    ...load(),
    setBusiness: (businessId, businessName) => {
      const same = get().businessId === businessId;
      update(same ? { businessId, businessName } : { businessId, businessName, resourceId: null, resourceName: null, qr: null });
    },
    setCompany: (companyId) => update({ companyId }),
    setResource: (resourceId, resourceName) => update({ resourceId, resourceName }),
    setQr: (qr) => update({ qr }),
    clear: () => { save(empty); set(empty); },
  };
});

const pick = (s: Persisted): Persisted => ({ companyId: s.companyId, businessId: s.businessId, businessName: s.businessName, resourceId: s.resourceId, resourceName: s.resourceName, qr: s.qr });

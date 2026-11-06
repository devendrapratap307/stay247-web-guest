import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { QrCode } from '../../../components/ui/QrCode';
import { ROUTES } from '../../../config/routes';
import { useT } from '../../../i18n/i18n';
import { useAuthStore } from '../../../stores/auth.store';
import { usePrefsStore } from '../../../stores/prefs.store';
import { useTenantStore } from '../../../stores/tenant.store';
import { confirmAction, toast } from '../../../stores/ui.store';
import { openAuth } from '../../auth/hooks/useAuthDialog';
import { BookingSheet } from '../../booking/components/BookingSheet';
import { todayIso } from '../../booking/schemas/booking.schema';
import { CartPanel } from '../../cart/components/CartPanel';
import { useCheckoutStep } from '../../cart/hooks/useCheckoutStep';
import { belongsElsewhere, useCartStore } from '../../cart/hooks/useCartStore';
import type { NewCartLine } from '../../cart/types/cart.types';
import { CatalogCard } from '../components/CatalogCard';
import { BusinessAutocomplete } from '../components/BusinessAutocomplete';
import { CategoryChips } from '../components/CategoryChips';
import { IsoPicker } from '../components/IsoPicker';
import { QrBreadcrumb } from '../components/QrFlow';
import { RentalPanel } from '../components/RentalPanel';
import { ALL_TYPE, MAP_TYPES, typeIcon } from '../config/booking-types';
import { useBookingTypes, useCatalog, useCompanies, useLocations, useResourceMap } from '../hooks/useBrowse';
import type { BookTarget, CatalogEntry } from '../types/browse.types';
import { parseQrCode } from '../utils/qr-code';

/** The grid's sections: one per type for All (items to order first, then each bookable type), else one untitled section. */
function sections(entries: CatalogEntry[], all: boolean, types: { code: string; icon: string; label: string }[]) {
  if (!all) return [{ key: 'one', title: '', icon: '', rows: entries }];
  const out: { key: string; title: string; icon: string; rows: CatalogEntry[] }[] = [];
  const items = entries.filter((e) => e.kind === 'item');
  if (items.length) out.push({ key: 'items', title: 'Order & buy', icon: '🛒', rows: items });
  for (const e of entries.filter((x) => x.kind === 'resource')) {
    let sec = out.find((s) => s.key === `res:${e.type}`);
    if (!sec) {
      const tv = types.find((x) => x.code === e.type);
      sec = { key: `res:${e.type}`, title: `Book ${tv ? tv.label.toLowerCase() : e.type}`, icon: tv?.icon ?? typeIcon(e.type), rows: [] };
      out.push(sec);
    }
    sec.rows.push(e);
  }
  return out;
}

/** Asks before replacing a cart that belongs to another business. */
async function okToUse(businessId: string) {
  if (!belongsElsewhere(businessId)) return true;
  const other = useCartStore.getState().businessName ?? 'another place';
  return confirmAction({ title: 'Start a new cart?', message: `Your cart has items from ${other}. Adding this will clear it.`, confirmLabel: 'Start new cart', danger: true });
}

/**
 * Guest home (prototype "Guest app → Web app"): gradient hero with search row, QR call-to-action, booking-type chips,
 * "X near <location>" card grid (+ 3D picker for tables/rooms) and the sticky cart / checkout side panel.
 */
export function BrowsePage() {
  const t = useT();
  const nav = useNavigate();
  const loc = useLocation();
  const types = [ALL_TYPE, ...useBookingTypes()];
  const [sp, setSp] = useSearchParams();
  const type = sp.get('type') || ALL_TYPE.code;
  const isAll = type === ALL_TYPE.code;
  const typeFilter = isAll ? '' : type; // business lists: every business for All
  const q = sp.get('q') ?? '';
  const date = sp.get('date') || todayIso();
  const guests = Math.max(1, Number(sp.get('guests')) || 2);
  const setParam = (k: string, v: string) => setSp((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n; }, { replace: true });

  const signedIn = useAuthStore((s) => s.signedIn);
  const { companyId, businessId, businessName, resourceId, qr, setBusiness, setCompany } = useTenantStore();
  const { saved, toggleSaved } = usePrefsStore();
  const lines = useCartStore((s) => s.lines);
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const step = useCheckoutStep();
  const [target, setTarget] = useState<BookTarget | null>(null);
  const [code, setCode] = useState('');
  const side = useRef<HTMLDivElement>(null);

  const companies = useCompanies(typeFilter);
  const locations = useLocations('', typeFilter, companyId ?? '');
  const isRental = type === 'rental';
  const tv = types.find((x) => x.code === type) ?? { code: type, icon: typeIcon(type), label: type };
  const viaQr = !!qr && qr.type === type;

  // Location options: the chosen business's locations (or every listed one), plus the current place (e.g. from a QR) if it
  // is not listed and no business is chosen.
  const options = useMemo(() => {
    const list = locations.data ?? [];
    return businessId && !companyId && !list.some((l) => l.business_id === businessId) ? [{ business_id: businessId, name: businessName ?? 'Current place', types: [] }, ...list] : list;
  }, [locations.data, businessId, businessName, companyId]);
  const placeName = (l: { name: string; city?: string }) => (l.city ? `${l.name}, ${l.city}` : l.name);
  // With a business chosen, only its own locations count (never another host's place left over from before).
  const place = businessId && (!companyId || options.some((l) => l.business_id === businessId)) ? businessId : null;
  const catalog = useCatalog(isRental ? null : place, type, q);
  const map = useResourceMap(place, type, MAP_TYPES.has(type));

  // First visit, or a business whose locations do not include the current place: pick its first location.
  useEffect(() => {
    const list = locations.data;
    if (!list) return;
    const here = !!businessId && list.some((l) => l.business_id === businessId);
    if (here || (businessId && !companyId)) return;
    if (list[0]) setBusiness(list[0].business_id, placeName(list[0]));
  }, [businessId, companyId, locations.data, setBusiness]);
  // The chosen business no longer offers this type: show every business again.
  useEffect(() => {
    if (companyId && companies.data && !companies.data.some((c) => c.company_id === companyId)) setCompany(null);
  }, [companyId, companies.data, setCompany]);

  // Arriving from a QR for a bookable resource: open its booking sheet ("nothing to select").
  const autoBook = (loc.state as { book?: boolean } | null)?.book && viaQr && !!resourceId;
  useEffect(() => {
    if (!autoBook || catalog.isLoading) return;
    const e = catalog.data?.find((x) => x.id === resourceId);
    if (qr && MAP_TYPES.has(qr.type) || (e?.kind === 'resource') || ['parking', 'venue', 'appt'].includes(qr!.type)) {
      setTarget({ id: resourceId!, name: e?.name ?? qr!.resource, type, price_minor: e?.price_minor ?? 0, meta: e?.meta, viaQr: true });
    }
    nav(`${loc.pathname}${loc.search}`, { replace: true, state: null });
  }, [autoBook, catalog.isLoading, catalog.data, resourceId, qr, type, nav, loc.pathname, loc.search]);

  const focusSide = () => setTimeout(() => side.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  const freshCheckout = () => { if (step.step === 'done') step.reset(); };
  const biz = place ? { id: place, name: businessName ?? '' } : null;

  const addItem = async (e: CatalogEntry) => {
    if (!biz || !(await okToUse(biz.id))) return;
    freshCheckout();
    add({ id: e.id, kind: 'item', type: e.type, name: e.name, icon: typeIcon(e.type), price_minor: e.price_minor }, 1, biz);
    toast.success(`${e.name} added`);
  };
  const book = (b: BookTarget) => { freshCheckout(); setTarget(b); focusSide(); };
  const confirmBooking = async (line: NewCartLine) => {
    if (!biz || !(await okToUse(biz.id))) return;
    add(line, 1, biz);
    setTarget(null);
    if (signedIn) step.go('pay'); else { step.go('cart'); openAuth('login'); }
    focusSide();
  };
  const pickType = (code: string) => { setTarget(null); setParam('type', code); };
  const enterCode = (e: FormEvent) => {
    e.preventDefault();
    const c = parseQrCode(code);
    if (!c) { toast.error("That code doesn't look right. Check the letters under the QR."); return; }
    nav(ROUTES.qr(c));
  };

  const isSaved = !!businessId && saved.some((s) => s.business_id === businessId);
  const entries = catalog.data ?? [];
  const qtyOf = (id: string) => lines.find((l) => l.key === id)?.qty ?? 0;

  return (
    <>
      <section className="hero fd" aria-labelledby="hero-title">
        <h1 id="hero-title">{t('hero.title')}</h1>
        <div>{t('hero.sub')}</div>
        <div className="hs">
          <div className="hs-field"><span>{t('hero.business')}</span>
            <BusinessAutocomplete value={place ? businessName ?? '' : ''} onPick={(l) => {
              setTarget(null);
              setCompany(l.company_id ?? null); // the Location list then offers this business's other branches
              setBusiness(l.business_id, placeName(l));
            }} />
            {companyId && <button type="button" className="hs-clear" onClick={() => { setTarget(null); setCompany(null); }}>{t('hero.allBusinesses')}</button>}
          </div>
          <label><span>{t('hero.location')}</span>
            <select className="input" aria-label={t('hero.location')} value={options.some((l) => l.business_id === businessId) ? businessId ?? '' : ''} onChange={(e) => {
              const l = options.find((x) => x.business_id === e.target.value);
              if (l) { setTarget(null); setBusiness(l.business_id, placeName(l)); }
            }}>
              {!options.length && <option value="">{locations.isLoading ? 'Loading…' : 'No places yet'}</option>}
              {options.map((l) => (
                <option key={l.business_id} value={l.business_id} title={'address' in l && l.address ? l.address : undefined}>
                  {placeName(l)}{!companyId && 'company_name' in l && l.company_name && l.company_name !== l.name ? ` (${l.company_name})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label><span>{t('hero.type')}</span>
            <select className="input" value={type} onChange={(e) => pickType(e.target.value)}>
              {types.map((x) => <option key={x.code} value={x.code}>{x.icon} {x.label}</option>)}
            </select>
          </label>
          <label><span>{t('hero.date')}</span>
            <input className="input" type="date" value={date} min={todayIso()} onChange={(e) => setParam('date', e.target.value)} />
          </label>
          <label><span>{t('hero.guests')}</span>
            <input className="input" type="number" min={1} max={500} value={guests} onChange={(e) => setParam('guests', e.target.value)} />
          </label>
          <label><span className="sr-only">{t('hero.search')}</span>
            <input className="input" type="search" placeholder={t('hero.search')} value={q} onChange={(e) => setParam('q', e.target.value)} aria-label="Search" style={{ marginTop: 18 }} />
          </label>
        </div>
      </section>

      <div className="gwg">
        <div>
          <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <QrCode value={`${window.location.origin}${ROUTES.scan}`} size={64} label="Scan page QR" />
            <div style={{ flex: 1, minWidth: 200 }}>
              <b>{t('qr.cta')}</b>
              <div className="muted">{t('qr.ctaSub')}</div>
            </div>
            <form className="row" style={{ gap: 6 }} onSubmit={enterCode}>
              <label className="sr-only" htmlFor="home-code">QR code</label>
              <input id="home-code" className="input" style={{ width: 130 }} placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="off" />
              <Button type="submit" size="sm" variant="secondary" disabled={!code.trim()}>Go</Button>
              <Link className="btn sm" to={ROUTES.scan}>📷 {t('nav.scanQr')}</Link>
            </form>
          </div>

          <CategoryChips types={types} value={type} onChange={pickType} />

          {viaQr && qr && <div className="card ctxbar"><QrBreadcrumb company={qr.company} business={qr.business} location={qr.location} resource={qr.resource} /></div>}

          <div className="row" style={{ justifyContent: 'space-between', margin: '0 0 10px' }}>
            <h3 style={{ margin: 0 }}>{tv.icon} {tv.label} {t('near')} {place ? businessName ?? '…' : '…'}</h3>
            {businessId && businessName && (
              <Button size="sm" variant="ghost" aria-pressed={isSaved} onClick={() => toggleSaved({ business_id: businessId, name: businessName })}>{isSaved ? '★ Saved' : '☆ Save place'}</Button>
            )}
          </div>

          {!place ? (
            locations.isLoading ? <Loader /> : <EmptyState title={companyId && !options.length ? 'This business has no location offering this here.' : "Pick a location to see what's available"}
              hint={companyId && !options.length ? 'Pick another type, or choose “All businesses”.' : 'Or scan the QR at your table, bay or room.'} action={<Link className="btn" to={ROUTES.scan}>📷 {t('nav.scanQr')}</Link>} />
          ) : isRental ? <RentalPanel businessId={place} search={q} onBook={(l) => void confirmBooking(l)} />
            : catalog.error ? <ErrorMessage error={catalog.error} onRetry={() => void catalog.refetch()} /> : catalog.isLoading ? <Loader /> : (
            <>
              {!isAll && MAP_TYPES.has(type) && !!map.data?.length && (
                <div className="card" style={{ padding: 6, marginBottom: 12 }}>
                  <IsoPicker
                    nodes={map.data}
                    type={type}
                    selectedId={target?.id}
                    onBusy={(n) => toast.info(`${n.name} is already booked`)}
                    onPick={(n) => {
                      const e = entries.find((x) => x.id === n.id);
                      book({ id: n.id, name: n.name, type, price_minor: e?.price_minor ?? 0, meta: e?.meta });
                    }}
                  />
                </div>
              )}
              {entries.length ? sections(entries, isAll, types).map((sec) => (
                <section key={sec.key} aria-label={sec.title} className="gsec">
                  {sec.title && <h4 className="gsec-h">{sec.icon} {sec.title} <span className="muted">· {sec.rows.length}</span></h4>}
                  <div className="gcards fd">
                    {sec.rows.map((e) => (
                      <CatalogCard
                        key={e.id}
                        entry={e}
                        qty={qtyOf(e.id)}
                        selected={target?.id === e.id}
                        onAdd={() => void addItem(e)}
                        onQty={(n) => (n < 1 ? remove(e.id) : setQty(e.id, n))}
                        onBook={() => book({ id: e.id, name: e.name, type: e.type, price_minor: e.price_minor, meta: e.meta })}
                      />
                    ))}
                  </div>
                </section>
              )) : <EmptyState title={q ? 'Nothing matches.' : 'Nothing available right now.'} hint={q ? 'Try a different search.' : 'This place has nothing free or in stock for this right now. Try another time, type or location.'} />}
            </>
          )}
        </div>

        <aside className="gside" ref={side} aria-label="Cart and checkout">
          {target ? (
            <BookingSheet
              key={`${target.id}-${date}`}
              target={target}
              qr={target.viaQr ? qr : null}
              defaultDate={date}
              defaultGuests={guests}
              onConfirm={(l) => void confirmBooking(l)}
              onCancel={() => setTarget(null)}
            />
          ) : <CartPanel />}
        </aside>
      </div>
    </>
  );
}

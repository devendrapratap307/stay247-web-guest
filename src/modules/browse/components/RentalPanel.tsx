import { useMemo, useState } from 'react';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { formatMoney } from '../../../utils/currency.utils';
import type { NewCartLine } from '../../cart/types/cart.types';
import { typeIcon } from '../config/booking-types';
import { useCatalog } from '../hooks/useBrowse';
import { DURATION_UNITS, nextHourLocal, rentalEnd, rentalPrice, type DurationUnit } from '../utils/rental';

const UNIT_WORD: Record<string, string> = { hour: '/ hr', day: '/ day', night: '/ night', flat: 'flat' };
const fmt = (d: Date) => d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/**
 * Rentals search (prototype "Rentals"): pickup time + duration, vehicle-category chips, sort and an available-only
 * toggle. Prices are the total for the period, computed the way the server charges them.
 */
export function RentalPanel({ businessId, search, onBook }: { businessId: string; search: string; onBook: (line: NewCartLine) => void }) {
  const [pickup, setPickup] = useState(nextHourLocal);
  const [qty, setQty] = useState(4);
  const [unit, setUnit] = useState<DurationUnit>('hours');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState<'low' | 'high'>('low');
  const [onlyFree, setOnlyFree] = useState(true);

  const from = useMemo(() => new Date(pickup), [pickup]);
  const valid = !Number.isNaN(from.getTime()) && from.getTime() > Date.now() - 15 * 60_000;
  const to = useMemo(() => rentalEnd(valid ? from : new Date(), qty, unit), [from, valid, qty, unit]);
  const win = valid ? { from: from.toISOString(), to: to.toISOString() } : undefined;
  const catalog = useCatalog(businessId, 'rental', search, win, !onlyFree); // the server lists only free vehicles unless asked for all

  const rows = useMemo(() => {
    return (catalog.data ?? []).filter((e) => e.kind === 'resource').map((e) => {
      const priceUnit = typeof e.meta.price_unit === 'string' && e.meta.price_unit ? e.meta.price_unit : 'hour';
      return { e, label: String(e.meta.type_label || 'Other'), priceUnit, total: rentalPrice(e.price_minor, priceUnit, from, to) };
    });
  }, [catalog.data, from, to]);
  const cats = useMemo(() => [...new Set(rows.map((r) => r.label))].sort(), [rows]);
  const shown = rows
    .filter((r) => (!cat || r.label === cat) && (!onlyFree || r.e.available))
    .sort((a, b) => (sort === 'low' ? a.total - b.total : b.total - a.total));

  const book = (r: (typeof rows)[number]) => onBook({
    key: `${r.e.id}@${from.toISOString()}`,
    id: r.e.id, kind: 'resource', type: 'rental', name: r.e.name, icon: typeIcon('rental'), price_minor: r.total,
    from: from.toISOString(), to: to.toISOString(), detail: `${fmt(from)} → ${fmt(to)}`, guests: 1,
  });

  return (
    <div className="fd">
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 12 }}>
        <label><span className="muted">Pickup</span>
          <input className="input" type="datetime-local" value={pickup} min={nextHourLocal(new Date(Date.now() - 3_600_000))} onChange={(e) => setPickup(e.target.value)} aria-invalid={!valid} />
        </label>
        <label><span className="muted">Duration</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="input" type="number" min={1} max={90} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} aria-label="Duration" style={{ width: 70 }} />
            <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as DurationUnit)} aria-label="Duration unit" style={{ flex: 1, minWidth: 0 }}>
              {DURATION_UNITS.map((u) => <option key={u.code} value={u.code}>{u.label}</option>)}
            </select>
          </div>
        </label>
        <label><span className="muted">Sort by</span>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as 'low' | 'high')}>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
        <label className="row" style={{ gap: 8, alignSelf: 'end', paddingBottom: 8 }}>
          <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} /> Available only
        </label>
      </div>

      {!valid ? <EmptyState title="Pick a pickup time in the future." />
        : catalog.error ? <ErrorMessage error={catalog.error} onRetry={() => void catalog.refetch()} />
          : catalog.isLoading ? <Loader /> : (
            <>
              <div className="muted" style={{ marginBottom: 8 }}>Return by <b>{fmt(to)}</b></div>
              {cats.length > 1 && (
                <div className="row" role="toolbar" aria-label="Vehicle type" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {['', ...cats].map((c) => (
                    <button key={c || 'all'} type="button" className={`chip ${cat === c ? 'ok' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)} style={{ cursor: 'pointer', border: 0 }}>{c || 'All'}</button>
                  ))}
                </div>
              )}
              {shown.length ? (
                <div className="gcards">
                  {shown.map((r) => (
                    <article key={r.e.id} className={`card gc ${r.e.available ? '' : 'na'}`} aria-label={r.e.name}>
                      <div className="im" aria-hidden>{r.e.image ? <img src={r.e.image} alt="" loading="lazy" /> : typeIcon('rental')}</div>
                      <div className="bd">
                        <b>{r.e.name}</b>
                        <div className="muted" style={{ fontSize: 12 }}>{r.label} · {formatMoney(r.e.price_minor)} {UNIT_WORD[r.priceUnit] ?? ''}</div>
                        <div className="row">
                          <span><b>{formatMoney(r.total)}</b> <span className="muted">total</span></span>
                          {r.e.available ? <Button size="sm" onClick={() => book(r)}>Add to cart</Button> : <span className="chip bad">Booked</span>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <EmptyState title="Nothing free for that period." hint="Try another pickup time, a shorter duration, or turn off “Available only”." />}
            </>
          )}
    </div>
  );
}

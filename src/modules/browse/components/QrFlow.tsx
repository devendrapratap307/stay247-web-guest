import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ROUTES } from '../../../config/routes';
import { DEFAULT_TYPES, QR_ACTIONS, typeIcon } from '../config/booking-types';
import { useResolveCode } from '../hooks/useBrowse';
import type { Resolved } from '../types/browse.types';
import { parseQrCode } from '../utils/qr-code';
import { QrScanner } from './QrScanner';

/** "Company › Business › Location › Resource  [via QR]" */
export function QrBreadcrumb({ company, business, location, resource }: { company?: string; business: string; location?: string; resource: string }) {
  return (
    <div className="crumb" aria-label="Scanned place">
      <span aria-hidden>📍</span>
      <span>{[company, business, location, resource].filter(Boolean).join(' › ')}</span>
      <span className="chip ok">via QR</span>
    </div>
  );
}

const typeLabel = (code: string) => DEFAULT_TYPES.find((t) => t.code === code)?.label ?? code;

function Landing({ r, onAgain }: { r: Resolved; onAgain: () => void }) {
  const nav = useNavigate();
  const act = QR_ACTIONS[r.type] ?? { verb: 'booking', actions: ['Book or order here'] };
  return (
    <div className="stack fd">
      <div className="hero" style={{ padding: 22, margin: 0 }}>
        <div style={{ color: '#ffffffcc' }}>📍 {r.business_name}</div>
        <h1 style={{ fontSize: 24, margin: '4px 0 0' }}>{r.path || [r.location_name, r.resource_name].filter(Boolean).join(' › ')}</h1>
      </div>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40 }} aria-hidden>{typeIcon(r.type)}</div>
        <span className="chip ok">QR verified · {typeLabel(r.type)}</span>
        <div style={{ marginTop: 10 }}><QrBreadcrumb company={r.company_name} business={r.business_name} location={r.location_name} resource={r.resource_name} /></div>
      </div>
      <div>
        <b style={{ display: 'block', margin: '4px 0 6px' }}>What you can do</b>
        {act.actions.map((a) => <div key={a} className="pr"><span>✓ {a}</span></div>)}
      </div>
      <Button className="big" onClick={() => nav(`${ROUTES.browse}?type=${encodeURIComponent(r.type)}`, { state: { book: true } })}>Continue to {act.verb}</Button>
      {(r.type === 'table' || r.type === 'room') && (
        <Button className="big" variant="secondary" onClick={() => nav(`${ROUTES.browse}?type=food`)}>🍕 Order food to {r.resource_name}</Button>
      )}
      <Button className="big" variant="secondary" onClick={onAgain}>Scan another</Button>
    </div>
  );
}

function Bad({ onAgain }: { onAgain: () => void }) {
  const nav = useNavigate();
  return (
    <div className="stack fd" style={{ textAlign: 'center' }} role="alert">
      <div style={{ fontSize: 50, marginTop: 20 }} aria-hidden>⚠️</div>
      <h2>This QR can&apos;t be used</h2>
      <p className="muted">It may be expired, deactivated or not from StayServe. Ask the staff for a new code.</p>
      <Button className="big" onClick={onAgain}>Scan again</Button>
      <Button className="big" variant="secondary" onClick={() => nav(ROUTES.browse)}>Choose manually</Button>
    </div>
  );
}

/**
 * Scan → "Reading code…" → landing (what you can do here) or "This QR can't be used". Works signed out.
 */
export function QrFlow({ initialCode }: { initialCode?: string }) {
  const resolve = useResolveCode();
  const [pending, setPending] = useState<string | null>(initialCode ?? null);
  const [bad, setBad] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!pending || sent.current === pending) return;
    if (!parseQrCode(pending)) { setBad(true); return; }
    sent.current = pending; // resolving is public: guests sign in only to pay
    resolve.mutate(pending, { onError: () => setBad(true) });
  }, [pending, resolve]);

  const again = () => { setPending(null); setBad(false); sent.current = null; resolve.reset(); setAttempt((n) => n + 1); };

  if (bad) return <Bad onAgain={again} />;
  if (resolve.data) return <Landing r={resolve.data} onAgain={again} />;
  if (resolve.isPending) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }} role="status">
        <div style={{ fontSize: 46 }} aria-hidden>📷</div>
        <b>Reading code…</b>
        <div className="muted">{pending}</div>
        <div className="spinner" />
      </div>
    );
  }
  return (
    <div className="stack">
      <QrScanner key={attempt} onCode={(raw) => { if (!raw) { setBad(true); return; } setPending(raw); }} busy={resolve.isPending} />
      <p className="muted" style={{ fontSize: 12 }}>Tables, parking bays, rooms, counters and shops have a StayServe QR. The code is also printed under it.</p>
    </div>
  );
}

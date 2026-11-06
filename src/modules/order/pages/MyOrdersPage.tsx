import { useEffect, useState } from 'react';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { Button } from '../../../components/ui/Button';
import { RefreshButton } from '../../../components/ui/RefreshButton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Loader } from '../../../components/ui/Loader';
import { useT } from '../../../i18n/i18n';
import { formatMoney } from '../../../utils/currency.utils';
import { formatDateTime } from '../../../utils/date.utils';
import { titleCase } from '../../../utils/format.utils';
import { useMyBookings } from '../../booking';
import type { Booking } from '../../booking';
import { usePay } from '../../payment';
import { ReceiptDialog } from '../../receipt/components/ReceiptDialog';
import { useMyOrders } from '../hooks/useMyOrders';
import type { Order } from '../types/order.types';

const STEPS = ['Confirmed', 'Preparing', 'Ready'];
const step = (s: string) => (s === 'placed' || s === 'accepted' ? 0 : s === 'preparing' ? 1 : 2);

function Progress({ at }: { at: number }) {
  return (
    <div style={{ flex: 1 }}>
      <div className="sp" aria-hidden>{STEPS.map((s, i) => <i key={s} className={i <= at ? '' : 'off'} />)}</div>
      <div className="spl" aria-label={`Status: ${STEPS[at]}`}>{STEPS.map((s) => <span key={s}>{s}</span>)}</div>
    </div>
  );
}

/** "4:12" left until `until` (ISO), ticking every second; null once it has passed. */
function useLeft(until?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (!until) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, [until]);
  if (!until) return null;
  const s = Math.floor((new Date(until).getTime() - now) / 1000);
  return s > 0 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : null;
}

/** Badge of a guest order / booking still waiting: pay at venue → the place must confirm in time; online → awaiting payment. */
function Waiting({ mode, until }: { mode?: string; until?: string }) {
  const left = useLeft(until);
  if (mode === 'venue') {
    return <span className="chip warn" role="status">{left ? `Waiting for the place to confirm · ${left} left` : 'Confirmation time is over…'}</span>;
  }
  return <span className="chip warn" role="status">Awaiting payment</span>;
}

function OrderCard({ o, n, onReceipt }: { o: Order; n: number; onReceipt: () => void }) {
  const cancelled = o.status === 'cancelled', done = o.status === 'served', waiting = o.status === 'pending';
  const pay = usePay();
  return (
    <div className="card" style={{ position: 'relative', margin: '14px 0 8px' }}>
      <span className="cn" aria-hidden>{n}</span>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>{o.number ?? 'Order'}</b>
        {waiting ? <Waiting mode={o.payment_mode} until={o.confirm_by} />
          : <span className={`chip ${cancelled ? 'bad' : done || o.status === 'ready' ? 'ok' : 'warn'}`}>{done ? 'Served' : cancelled && o.payment_mode === 'venue' && !o.paid_at ? 'Cancelled · not confirmed in time' : titleCase(o.status === 'placed' ? 'confirmed' : o.status)}</span>}
      </div>
      <div className="muted">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')} · {o.business_name}</div>
      <div className="row" style={{ marginTop: 8, alignItems: 'center' }}>
        {!cancelled && !done && !waiting ? <Progress at={step(o.status)} /> : <span className="muted" style={{ flex: 1, fontSize: 12 }}>{formatDateTime(o.created_at)}</span>}
        <b>{formatMoney(o.total_minor)}</b>
      </div>
      <div className="row" style={{ marginTop: 8, gap: 6 }}>
        <Button size="sm" variant="secondary" onClick={onReceipt}>🧾 Receipt</Button>
        {waiting && o.payment_mode !== 'venue' && <Button size="sm" loading={pay.isPending} onClick={() => pay.mutate({ orderId: o.id })}>Pay now</Button>}
      </div>
    </div>
  );
}

function BookingCard({ b, n, onReceipt }: { b: Booking; n: number; onReceipt: () => void }) {
  const pay = usePay();
  const tone = b.status === 'confirmed' || b.status === 'completed' ? 'ok' : b.status === 'pending' ? 'warn' : 'bad';
  return (
    <div className="card" style={{ position: 'relative', margin: '14px 0 8px' }}>
      <span className="cn" aria-hidden>{n}</span>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>{b.number || 'Booking'}</b>
        {b.status === 'pending' ? <Waiting mode={b.payment_mode} until={b.confirm_by} />
          : <span className={`chip ${tone}`}>{b.status === 'cancelled' && b.payment_mode === 'venue' ? 'Cancelled · not confirmed in time' : titleCase(b.status)}</span>}
      </div>
      <div className="muted">{b.resource_name} · {b.business_name}</div>
      <div className="row" style={{ marginTop: 6, justifyContent: 'space-between' }}>
        <span className="muted" style={{ fontSize: 12 }}>{formatDateTime(b.from)} → {formatDateTime(b.to)}</span>
        <b>{formatMoney(b.amount_minor)}</b>
      </div>
      <div className="row" style={{ marginTop: 8, gap: 6 }}>
        <Button size="sm" variant="secondary" onClick={onReceipt}>🎟 Voucher</Button>
        {b.status === 'pending' && b.payment_mode !== 'venue' && b.amount_minor > 0 && <Button size="sm" loading={pay.isPending} onClick={() => pay.mutate({ bookingId: b.id })}>Pay now</Button>}
      </div>
    </div>
  );
}

/** Design "My orders": live status of orders and bookings at every place, receipts and pay-later for held bookings. */
export function MyOrdersPage() {
  const t = useT();
  const [tab, setTab] = useState<'orders' | 'bookings'>('orders');
  const orders = useMyOrders();
  const bookings = useMyBookings();
  const [doc, setDoc] = useState<{ kind: 'order' | 'booking'; id: string } | null>(null);
  const q = tab === 'orders' ? orders : bookings;
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="hero" style={{ padding: 22 }}>
        <h1 style={{ fontSize: 24 }}>{t('orders.title')}</h1>
        <div style={{ color: '#ffffffcc' }}>{t('orders.live')}</div>
      </div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div className="seg row" role="tablist" aria-label="Show">
          <Button size="sm" role="tab" aria-selected={tab === 'orders'} variant={tab === 'orders' ? 'primary' : 'secondary'} onClick={() => setTab('orders')}>Orders</Button>
          <Button size="sm" role="tab" aria-selected={tab === 'bookings'} variant={tab === 'bookings' ? 'primary' : 'secondary'} onClick={() => setTab('bookings')}>Bookings</Button>
        </div>
        <RefreshButton onRefresh={() => void q.refetch()} updatedAt={q.updatedAt} refreshing={q.isRefreshing} />
      </div>
      {q.error ? <ErrorMessage error={q.error} onRetry={() => void q.refetch()} /> : q.isLoading ? <Loader /> : !q.rows.length ? (
        <EmptyState title={tab === 'orders' ? 'No orders yet' : 'No bookings yet'} hint="Browse a place or scan a QR to get started." />
      ) : tab === 'orders'
        ? orders.rows.map((o, i) => <OrderCard key={o.id} o={o} n={i + 1} onReceipt={() => setDoc({ kind: 'order', id: o.id })} />)
        : bookings.rows.map((b, i) => <BookingCard key={b.id} b={b} n={i + 1} onReceipt={() => setDoc({ kind: 'booking', id: b.id })} />)}
      {q.hasMore && <Button variant="secondary" loading={q.isFetchingMore} onClick={q.loadMore}>Show more</Button>}
      <ReceiptDialog doc={doc} onClose={() => setDoc(null)} />
    </div>
  );
}

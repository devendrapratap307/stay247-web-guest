import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { QrContext } from '../../../stores/tenant.store';
import { formatMoney } from '../../../utils/currency.utils';
import { bookingPrice, bookingWindow, ruleFor } from '../../browse/config/booking-rules';
import { typeIcon } from '../../browse/config/booking-types';
import type { BookTarget } from '../../browse/types/browse.types';
import type { NewCartLine } from '../../cart/types/cart.types';
import { bookingSheetSchema, todayIso } from '../schemas/booking.schema';

interface Props {
  target: BookTarget;
  /** Set when the guest arrived by scanning this resource's QR: everything above the resource is locked. */
  qr?: QrContext | null;
  defaultDate?: string;
  defaultGuests?: number;
  onConfirm: (line: NewCartLine) => void;
  onCancel: () => void;
}

const fmtDay = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/** Date + slot + units for one resource (prototype: QR booking sheet "Scanned via QR · nothing to select"). */
export function BookingSheet({ target, qr, defaultDate, defaultGuests, onConfirm, onCancel }: Props) {
  const rule = useMemo(() => ruleFor(target.type, target.meta), [target.type, target.meta]);
  const [date, setDate] = useState(defaultDate && defaultDate >= todayIso() ? defaultDate : todayIso());
  const [slot, setSlot] = useState<string | undefined>(rule.slots?.[0]);
  const [units, setUnits] = useState(rule.unit?.word === 'guests' && defaultGuests ? Math.max(rule.unit.min, defaultGuests) : rule.unit?.initial ?? 1);
  const [err, setErr] = useState('');

  const win = bookingWindow(rule, date, slot, units);
  const price = bookingPrice(rule, target.price_minor, units);
  const priceLabel = rule.pricing === 'per_unit' && rule.unit
    ? `${units} ${rule.unit.word} × ${formatMoney(target.price_minor)}`
    : rule.fixedLabel ?? 'Charge';

  const confirm = () => {
    const ok = bookingSheetSchema.safeParse({ date, from: win.from, units });
    if (!ok.success) { setErr(ok.error.issues[0]?.message ?? 'Check the details'); return; }
    const detail = rule.stay
      ? `${fmtDay(win.from)} → ${fmtDay(win.to)} · ${units} ${rule.unit?.word ?? ''}${units > 1 ? 's' : ''}`
      : `${fmtDay(win.from)} · ${slot && !/^\d/.test(slot) ? `${slot} · ` : ''}${fmtTime(win.from)}${rule.unit ? ` · ${units} ${rule.unit.word}` : ''}`;
    onConfirm({
      id: target.id, kind: 'resource', type: target.type, name: target.name, icon: typeIcon(target.type),
      price_minor: price, from: win.from.toISOString(), to: win.to.toISOString(), detail,
      guests: rule.unit?.word === 'guests' ? units : undefined,
    });
  };

  return (
    <div className="card fd" aria-label={`Book ${target.name}`}>
      {qr && <div className="crumb">🏢 {[qr.company, qr.business, qr.location].filter(Boolean).join(' › ')}</div>}
      <h3 style={{ margin: '4px 0' }}>{typeIcon(target.type)} {target.name}</h3>
      {qr && (
        <>
          <span className="chip ok">Scanned via QR · nothing to select</span>
          <div className="row" style={{ gap: 6, margin: '8px 0' }}>
            {['Company', 'Business', 'Location', 'Resource'].map((c) => <span key={c} className="chip ok">🔒 {c}</span>)}
          </div>
        </>
      )}
      <Input label={rule.dateLabel} type="date" value={date} min={todayIso()} onChange={(e) => { setDate(e.target.value); setErr(''); }} />
      {rule.slots && (
        <div className="field">
          <span className="muted" style={{ fontSize: 13 }}>{rule.slotLabel}</span>
          <div className="slots" role="radiogroup" aria-label={rule.slotLabel}>
            {rule.slots.map((s) => (
              <Button key={s} size="sm" variant={s === slot ? 'primary' : 'secondary'} role="radio" aria-checked={s === slot} onClick={() => { setSlot(s); setErr(''); }}>{s}</Button>
            ))}
          </div>
        </div>
      )}
      {rule.unit && (
        <div className="field">
          <span className="muted" style={{ fontSize: 13 }}>{rule.unit.label}</span>
          <div className="qty">
            <Button size="sm" variant="secondary" aria-label={`Fewer ${rule.unit.word}`} onClick={() => setUnits((n) => Math.max(rule.unit!.min, n - rule.unit!.step))}>−</Button>
            <b aria-live="polite">{units}</b>
            <Button size="sm" aria-label={`More ${rule.unit.word}`} onClick={() => setUnits((n) => Math.min(10_000, n + rule.unit!.step))}>+</Button>
          </div>
        </div>
      )}
      <div className="card" style={{ marginTop: 4 }}>
        <div className="sum mute"><span>{priceLabel}</span><span>{formatMoney(price)}</span></div>
        <div className="sum total"><span>Total</span><span>{formatMoney(price)}</span></div>
        <div className="muted" style={{ fontSize: 12 }}>Taxes included · the business confirms the final price.</div>
      </div>
      {err && <div role="alert" className="field-error">{err}</div>}
      <Button className="big" style={{ marginTop: 10 }} onClick={confirm}>Continue to payment</Button>
      <Button className="big" variant="secondary" style={{ marginTop: 8 }} onClick={onCancel}>Cancel</Button>
    </div>
  );
}

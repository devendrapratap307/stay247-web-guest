import { useEffect } from 'react';
import { FormProvider, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '../../../components/form/FormInput';
import { applyServerErrors, useZodForm } from '../../../components/form/useZodForm';
import { Button } from '../../../components/ui/Button';
import { QrCode } from '../../../components/ui/QrCode';
import { ROUTES } from '../../../config/routes';
import { useT } from '../../../i18n/i18n';
import { useAuthStore } from '../../../stores/auth.store';
import { formatMoney } from '../../../utils/currency.utils';
import { openAuth, useMe } from '../../auth';
import { checkoutError, useCheckout } from '../hooks/useCheckout';
import { useCheckoutStep } from '../hooks/useCheckoutStep';
import { cartTotals, useCartStore } from '../hooks/useCartStore';
import { checkoutSchema, type CheckoutForm } from '../schemas/cart.schema';
import type { CartLine } from '../types/cart.types';

const METHODS = [
  { value: 'upi', key: 'pay.upi' },
  { value: 'card', key: 'pay.card' },
  { value: 'venue', key: 'pay.venue' },
] as const;

function Totals({ lines }: { lines: CartLine[] }) {
  const t = useT();
  const s = cartTotals(lines);
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="sum mute"><span>{s.count} {s.count === 1 ? 'item' : 'items'}</span><span>{t('cart.inclTax')}</span></div>
      <div className="sum total"><span>{t('cart.total')}</span><span>{formatMoney(s.total)}</span></div>
    </div>
  );
}

/** Line cards: number badge top-left, remove ✕ top-right, quantity stepper for items, booking window for resources. */
export function CartLines({ lines }: { lines: CartLine[] }) {
  const { setQty, remove } = useCartStore();
  return (
    <div>
      {lines.map((l, i) => (
        <div key={l.key} className="cline">
          <span className="cn" aria-hidden>{i + 1}</span>
          <button type="button" className="cx" aria-label={`Remove ${l.name}`} onClick={() => remove(l.key)}>✕</button>
          <span aria-hidden style={{ fontSize: 20 }}>{l.icon}</span>
          <div className="nm"><b>{l.name}</b>{l.detail && <small>{l.detail}</small>}</div>
          {l.kind === 'item' && (
            <span className="qty">
              <Button size="sm" variant="secondary" aria-label={`Decrease ${l.name}`} onClick={() => (l.qty > 1 ? setQty(l.key, l.qty - 1) : remove(l.key))}>−</Button>
              <span aria-label="Quantity">{l.qty}</span>
              <Button size="sm" aria-label={`Increase ${l.name}`} onClick={() => setQty(l.key, l.qty + 1)}>+</Button>
            </span>
          )}
          <b style={{ minWidth: 64, textAlign: 'right' }}>{formatMoney(l.price_minor * l.qty)}</b>
        </div>
      ))}
    </div>
  );
}

function PayStep() {
  const t = useT();
  const lines = useCartStore((s) => s.lines);
  const go = useCheckoutStep((s) => s.go);
  const finish = useCheckoutStep((s) => s.finish);
  const me = useMe().data;
  const rental = lines.some((l) => l.type === 'rental');
  const form = useZodForm<CheckoutForm>(checkoutSchema(), { name: me?.name ?? '', phone: me?.phone ?? '', method: 'upi' });
  const method = useWatch({ control: form.control, name: 'method' });
  const checkout = useCheckout();
  const total = cartTotals(lines).total;
  // The profile may load after the form mounts: prefill whatever the guest has not typed yet.
  useEffect(() => {
    if (!me) return;
    if (!form.getValues('name') && me.name) form.setValue('name', me.name);
    if (!form.getValues('phone') && me.phone) form.setValue('phone', me.phone);
  }, [me, form]);

  const submit = form.handleSubmit(async (v) => {
    try { finish(await checkout.mutateAsync(v)); } catch (e) {
      if (!applyServerErrors(form, e)) form.setError('root', { message: checkoutError(e) });
    }
  });

  return (
    <FormProvider {...form}>
      <form className="card fd" onSubmit={submit} noValidate aria-label={t('pay.title')}>
        <b>{t('pay.title')}</b>
        <div style={{ marginTop: 8 }}>
          <FormInput name="name" label="Name" autoComplete="name" placeholder="Your name" />
          <FormInput name="phone" label="Phone" type="tel" autoComplete="tel" placeholder="+91" />
          {rental && <p className="muted" style={{ fontSize: 12 }}>🪪 Bring your driving licence: it is checked at pickup.</p>}
        </div>
        <div role="radiogroup" aria-label="Payment method">
          {METHODS.map((m) => (
            <label key={m.value} className="pm"><input type="radio" value={m.value} {...form.register('method')} /> {t(m.key)}</label>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12 }}>🔒 {method === 'venue' ? 'Pay at the counter when you arrive. The place confirms your order within a few minutes, or it is cancelled.' : t('pay.secured')}</p>
        <div className="sum total" style={{ margin: '12px 0' }}><span>{t('cart.total')}</span><span>{formatMoney(total)}</span></div>
        {form.formState.errors.root && <div role="alert" className="errorbox">{form.formState.errors.root.message}</div>}
        <Button type="submit" className="big" loading={checkout.isPending} disabled={!lines.length}>
          {method === 'venue' ? 'Confirm booking' : `${t('pay.now')} · ${formatMoney(total)}`}
        </Button>
        <Button className="big" variant="secondary" style={{ marginTop: 8 }} onClick={() => go('cart')}>{t('back')}</Button>
      </form>
    </FormProvider>
  );
}

function DoneStep() {
  const t = useT();
  const nav = useNavigate();
  const { result, reset } = useCheckoutStep();
  if (!result) return null;
  const status = result.method === 'venue' ? 'Pay at the venue · waiting for the place to confirm (see My orders)' : result.paid ? 'Paid · confirming with the bank' : 'Payment pending · you can pay from My orders';
  return (
    <div className="card fd" style={{ textAlign: 'center' }} role="status">
      <div style={{ fontSize: 48 }} aria-hidden>🎉</div>
      <h3>{result.hasBookings ? t('confirm.title') : 'Order placed'}</h3>
      <p className="muted">Ref <b>{result.ref}</b> · sent to the business</p>
      <QrCode value={result.pass} size={132} label={`QR pass ${result.ref}`} />
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Show this QR pass at the counter.</p>
      <div className="sum total" style={{ margin: '8px 0' }}><span>{t('cart.total')}</span><span>{formatMoney(result.total_minor)}</span></div>
      <span className={`chip ${result.paid ? 'ok' : 'warn'}`}>{status}</span>
      <Button className="big" style={{ marginTop: 12 }} onClick={() => { reset(); nav(ROUTES.orders); }}>{t('done')}</Button>
    </div>
  );
}

/** Sticky checkout panel (prototype gwSide): cart → payment → confirmation with booking ref and QR pass. */
export function CartPanel() {
  const t = useT();
  const lines = useCartStore((s) => s.lines);
  const businessName = useCartStore((s) => s.businessName);
  const signedIn = useAuthStore((s) => s.signedIn);
  const { step, go } = useCheckoutStep();

  if (step === 'done') return <DoneStep />;
  if (step === 'pay' && lines.length) return <PayStep />;
  return (
    <div className="card" aria-label={t('cart.title')}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>{t('cart.title')}</b>
        {businessName && lines.length > 0 && <span className="chip">{businessName}</span>}
      </div>
      {lines.length ? (
        <>
          <CartLines lines={lines} />
          <Totals lines={lines} />
          <p className="muted" style={{ fontSize: 12, margin: '8px 0' }}>Final prices are confirmed by the business.</p>
          <Button className="big" onClick={() => (signedIn ? go('pay') : openAuth('login'))}>{signedIn ? t('cart.checkout') : 'Log in to checkout'}</Button>
        </>
      ) : <p className="muted" style={{ marginTop: 8 }}>{t('cart.empty')}</p>}
    </div>
  );
}

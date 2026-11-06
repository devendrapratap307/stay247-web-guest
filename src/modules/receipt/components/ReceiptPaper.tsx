import type { ReactNode } from 'react';
import { QrCode } from '../../../components/ui/QrCode';
import { titleCase } from '../../../utils/format.utils';
import type { Receipt, ReceiptShow, Template } from '../types/receipt.types';
import { receiptFormat } from './receiptFormat';

export interface PaperOptions { template: Template; stamp: string; signature: boolean; computerGenerated: boolean; paper: 'A4' | 'A5' | '80mm' }

// Set from the receipt's business before each render (rendering is synchronous, so helpers below read the right formats).
let F = receiptFormat();
const M = (n: number) => F.num(n);
const $ = (n: number) => F.money(n);
const when = (iso?: string) => F.when(iso);
const OK_STAMP = /^(paid|confirmed|valid)$/i;
const METHOD: Record<string, string> = { upi: 'UPI', cash: 'Cash', card: 'Card', link: 'Payment link' };
const via = (m: string) => METHOD[m] ?? titleCase(m);

/**
 * The receipt with only the ticked header blocks (company, business, logo, address, GSTIN, terms). `terms` overrides the
 * business's terms heading / description for this print.
 */
export function withBlocks(r: Receipt, show: ReceiptShow, terms?: { title: string; text: string }): Receipt {
  const b = r.business;
  const title = terms ? terms.title.trim() : b.terms_title ?? '';
  const text = terms ? terms.text.trim() : b.terms ?? '';
  return {
    ...r,
    business: {
      ...b,
      company: show.company ? b.company : '', name: show.business ? b.name : '', logo: show.logo ? b.logo : '',
      address: show.address ? b.address : '', city: show.address ? b.city : '', gstin: show.gstin ? b.gstin : '',
      terms_title: show.terms && text ? title || 'Terms & Conditions' : '', terms: show.terms ? text : '',
    },
  };
}

/** Number to Indian-English words for the "Amount in words" line (rupees only). */
export function inWords(n: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x: number) => (x < 20 ? a[x]! : `${b[Math.floor(x / 10)]}${x % 10 ? ' ' + a[x % 10] : ''}`);
  const three = (x: number) => (x >= 100 ? `${a[Math.floor(x / 100)]} Hundred${x % 100 ? ' ' + two(x % 100) : ''}` : two(x));
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const cr = Math.floor(n / 1e7), lk = Math.floor((n % 1e7) / 1e5), th = Math.floor((n % 1e5) / 1e3), rest = n % 1e3;
  if (cr) parts.push(`${three(cr)} Crore`);
  if (lk) parts.push(`${two(lk)} Lakh`);
  if (th) parts.push(`${two(th)} Thousand`);
  if (rest) parts.push(three(rest));
  return parts.join(' ');
}

const Row = ({ a, b, strong }: { a: ReactNode; b: ReactNode; strong?: boolean }) => (
  <div className="rw" style={strong ? { fontWeight: 800, fontSize: 14 } : undefined}><span>{a}</span><span>{b}</span></div>
);

/** Name printed in titles: the business, else the company (whichever the receipt settings show). */
const title = (r: Receipt) => r.business.name || r.business.company || '';

/** Logo and company name above the document (each only when switched on in the receipt settings). */
function Brand({ r, center }: { r: Receipt; center?: boolean }) {
  const b = r.business;
  if (!b.logo && !b.company) return null;
  return (
    <div className="brand" style={center ? { justifyContent: 'center', flexDirection: 'column' } : undefined}>
      {b.logo && <img src={b.logo} alt="" />}
      {b.company && <b>{b.company}</b>}
    </div>
  );
}

const BAND_TEMPLATES: Template[] = ['modern', 'booking_voucher', 'rental'];

/**
 * Coloured header band of the Modern bill, booking voucher and rental agreement. The logo sits on a white tile at the left;
 * the company name is a small overline above the title (or the title itself when the business name is not shown).
 */
function BandHead({ r, over, title: heading, sub, tone, children }: { r: Receipt; over?: string; title: ReactNode; sub: ReactNode; tone?: 'ok' | 'teal'; children?: ReactNode }) {
  const b = r.business;
  const overline = over ?? b.company;
  return (
    <div className={`band${tone ? ` ${tone}` : ''}`}>
      <div className="band-head">
        {b.logo && <span className="band-logo"><img src={b.logo} alt="" /></span>}
        <div className="band-text">
          {overline && <div className="band-over">{overline}</div>}
          <b className="band-title">{heading}</b>
          <div className="band-sub">{sub}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Header({ r }: { r: Receipt }) {
  const b = r.business;
  const place = [b.name, [b.address, b.city].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  const ids = [b.gstin ? `GSTIN ${b.gstin}` : '', b.phone ?? ''].filter(Boolean).join(' · ');
  return <div className="muted-print">{place}{place && ids ? <br /> : null}{ids}</div>;
}

/** Terms & conditions with their description (only when switched on and written). */
function Terms({ r }: { r: Receipt }) {
  const b = r.business;
  if (!b.terms) return null;
  return <div className="terms"><b>{b.terms_title || 'Terms & Conditions'}</b><div>{b.terms}</div></div>;
}

function Footer({ r, o }: { r: Receipt; o: PaperOptions }) {
  return (
    <>
      <Terms r={r} />
      {o.signature && <div className="sign"><div>Authorised signatory</div></div>}
      {o.computerGenerated && <div className="cg-note">This is a computer generated document and does not require a signature.</div>}
    </>
  );
}

function Lines({ r, gst }: { r: Receipt; gst?: 'simple' | 'detailed' }) {
  if (!gst) return <>{r.lines.map((l, i) => <Row key={i} a={`${i + 1}. ${l.name} × ${F.qty(l.qty)}`} b={<b>{$(l.amount_minor)}</b>} />)}</>;
  const head = gst === 'detailed' ? ['#', 'Item', 'Qty', 'Rate', 'Taxable', 'CGST', 'SGST', 'Total'] : ['#', 'Description', 'Qty', 'Rate', 'Taxable', 'GST%', 'Amount'];
  return (
    <div className="scroll-x">
      <table>
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {r.lines.map((l, i) => {
            const tax = Math.round((l.amount_minor * l.tax_pct) / 100);
            return gst === 'detailed'
              ? <tr key={i}><td>{i + 1}</td><td>{l.name}</td><td>{F.qty(l.qty)}</td><td>{M(l.rate_minor)}</td><td>{M(l.amount_minor)}</td><td>{M(tax / 2)} ({l.tax_pct / 2}%)</td><td>{M(tax / 2)} ({l.tax_pct / 2}%)</td><td>{M(l.amount_minor + tax)}</td></tr>
              : <tr key={i}><td>{i + 1}</td><td>{l.name}</td><td>{F.qty(l.qty)}</td><td>{M(l.rate_minor)}</td><td>{M(l.amount_minor)}</td><td>{l.tax_pct}%</td><td>{M(l.amount_minor + tax)}</td></tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

function Totals({ r }: { r: Receipt }) {
  return (
    <>
      {r.tax_breakup.length > 0 && <Row a="Subtotal" b={$(r.subtotal_minor)} />}
      {r.tax_breakup.map((t) => <Row key={t.label} a={t.label} b={$(t.amount_minor)} />)}
      <Row a="Total" b={$(r.total_minor)} strong />
    </>
  );
}

/** One printable document; the template decides the layout. Stamp ("PAID", "DUPLICATE"…) is drawn over it. */
export function ReceiptPaper({ r, o }: { r: Receipt; o: PaperOptions }) {
  F = receiptFormat(r.business);
  const mono = o.template === 'pos' || o.template === 'kot' || o.template === 'pos_kot';
  const width = o.paper === '80mm' || mono ? 300 : o.paper === 'A5' ? 520 : o.template === 'detailed_gst' ? 720 : 640;
  const m = r.meta ?? {};
  const posBill = () => (
    <>
      <div style={{ textAlign: 'center' }}><b style={{ fontSize: 14 }}>{title(r).toUpperCase()}</b>{r.business.city ? <><br />{r.business.city}</> : null}{r.business.gstin ? <><br />GSTIN {r.business.gstin}</> : null}</div>
      <div className="dash" />Bill {r.number} · {when(r.date)}{m.where ? <><br />{m.where}</> : null}{r.party ? ` · ${r.party}` : ''}<div className="dash" />
      {r.lines.map((l, i) => <Row key={i} a={`${i + 1}. ${l.name.slice(0, 16)} ×${F.qty(l.qty)}`} b={M(l.amount_minor)} />)}
      <div className="dash" /><Totals r={r} /><div className="dash" />{r.paid_via ? `Paid: ${via(r.paid_via).toUpperCase()}` : titleCase(r.status)}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}><QrCode value={r.qr_payload} size={84} /></div>
      <Terms r={r} />
      <div style={{ textAlign: 'center' }}>Thank you! Visit again</div>
    </>
  );
  const kitchenTicket = () => (
    <>
      <div style={{ textAlign: 'center' }}><b style={{ fontSize: 20 }}>KOT {r.number}</b><div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0' }}>{(m.where || 'COUNTER').toUpperCase()}</div>{when(r.date)}</div>
      <div className="dash" />
      {r.lines.map((l, i) => <div key={i} style={{ fontSize: 16, fontWeight: 700, margin: '6px 0' }}>☐ {i + 1}. {F.qty(l.qty)} × {l.name}</div>)}
      <div className="dash" /><div style={{ textAlign: 'center' }}>— no prices —</div>
    </>
  );
  let body: ReactNode;
  switch (o.template) {
    case 'modern':
      body = (<>
        <BandHead r={r} over={r.business.name ? r.business.company : ''} title={title(r) || titleCase(r.kind)} sub={<>{titleCase(r.kind)} {r.number} · {when(r.date)}</>}>
          <div className="band-amount">{$(r.total_minor)}</div>
        </BandHead>
        {r.party && <div>Billed to <b>{r.party}</b>{r.phone ? ` · ${r.phone}` : ''}</div>}
        <Lines r={r} /><Totals r={r} />
        <div className="row" style={{ marginTop: 14 }}><QrCode value={r.qr_payload} size={72} /><div>{r.paid_via ? `Paid via ${via(r.paid_via)}` : `Status: ${titleCase(r.status)}`}<br />Thank you for your visit!</div></div>
      </>);
      break;
    case 'standard_gst':
    case 'detailed_gst':
      body = (<>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div><b style={{ fontSize: 16 }}>TAX INVOICE{o.template === 'detailed_gst' ? ' (Detailed)' : ''}</b><Header r={r} /></div><QrCode value={r.qr_payload} size={72} />
        </div>
        <Row a={<>Invoice: <b>{r.number}</b></>} b={`Date: ${when(r.date)}`} />
        <div>Bill to: <b>{r.party || 'Walk-in customer'}</b>{r.phone ? ` · ${r.phone}` : ''}</div>
        <Lines r={r} gst={o.template === 'detailed_gst' ? 'detailed' : 'simple'} />
        <div style={{ textAlign: 'right', marginTop: 8 }}><Totals r={r} /></div>
        <div style={{ marginTop: 6 }}>Amount in words: Rupees {inWords(Math.round(r.total_minor / 100))} Only</div>
      </>);
      break;
    case 'pos':
      body = posBill();
      break;
    case 'pos_kot':
      // the customer's bill, a cut line, then the kitchen's copy (same items, no prices)
      body = (<>{posBill()}<div className="cut" aria-label="Cut here">✂ ─ ─ ─ ─ kitchen copy ─ ─ ─ ─</div>{kitchenTicket()}</>);
      break;
    case 'kot':
      body = kitchenTicket();
      break;
    case 'booking_voucher':
      body = (<>
        <BandHead r={r} tone="ok" title={r.status === 'cancelled' ? 'Booking cancelled' : 'Booking confirmed ✓'} sub={<>Ref {r.number}{r.business.name ? ` · ${r.business.name}` : ''}</>} />
        <div className="row" style={{ alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Row a="Guest" b={<b>{r.party || '—'}</b>} /><Row a="Resource" b={<b>{m.resource}</b>} />
            <Row a="From" b={when(m.from)} /><Row a="To" b={when(m.to)} />
            {m.guests && <Row a="Guests" b={m.guests} />}<Row a="Amount" b={<b>{$(r.total_minor)}</b>} />
          </div>
          <QrCode value={r.qr_payload} size={84} />
        </div>
        <div className="dash" /><div className="muted-print">Show this QR at reception. Free cancellation until 24 h before the start.</div><Header r={r} />
      </>);
      break;
    case 'purchase':
      body = (<>
        <b style={{ fontSize: 16 }}>PURCHASE BILL</b><Header r={r} />
        <Row a={<>Bill <b>{r.number}</b></>} b={when(r.date)} /><div>Supplier: <b>{r.party}</b> · Into {m.warehouse}</div>
        <Lines r={r} gst="simple" /><Totals r={r} />
      </>);
      break;
    case 'rental':
      body = (<>
        <BandHead r={r} tone="teal" title="Rental agreement & receipt" sub={<>Ref {r.number}{r.business.name ? ` · ${r.business.name}` : ''}</>} />
        <div className="row" style={{ alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <Row a="Renter" b={<b>{r.party} · {r.phone}</b>} />{m.licence && <Row a="Licence / ID" b={m.licence} />}
            <Row a="Asset" b={<b>{m.asset}</b>} /><Row a="Pickup" b={when(m.from)} /><Row a="Return by" b={when(m.to)} />
          </div>
          <QrCode value={r.qr_payload} size={84} />
        </div>
        <div className="dash" /><Row a="Rental" b={$(r.total_minor)} /><Row a="Security deposit (refundable)" b={$(Number(m.deposit_minor || 0))} />
        <div className="dash" /><b>Condition at handover</b><div>☐ Fuel full &nbsp; ☐ No scratches &nbsp; ☐ Accessories &nbsp; ☐ Tyres OK</div>
        <div className="muted-print">Late return is charged per hour. The renter is liable for damage or loss.</div>
        <Row a="Renter signature ________" b="Authorised ________" />
      </>);
      break;
  }
  return (
    <div className={`paper${mono ? ' mono' : ''}`} style={{ width, maxWidth: '100%' }}>
      {o.template !== 'kot' && !BAND_TEMPLATES.includes(o.template) && <Brand r={r} center={mono} />}
      {body}
      {!mono && <Footer r={r} o={o} />}
      {o.stamp && <div className="stamp" style={{ color: OK_STAMP.test(o.stamp) ? '#12a36633' : '#e5484d33' }}>{o.stamp.toUpperCase()}</div>}
    </div>
  );
}

export const formatReceiptTotal = (r: Receipt) => receiptFormat(r.business).money(r.total_minor);

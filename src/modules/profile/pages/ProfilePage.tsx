import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { Button } from '../../../components/ui/Button';
import { Loader } from '../../../components/ui/Loader';
import { ROUTES } from '../../../config/routes';
import { useT } from '../../../i18n/i18n';
import { usePrefsStore, type Lang } from '../../../stores/prefs.store';
import { useTenantStore } from '../../../stores/tenant.store';
import { confirmAction, toast } from '../../../stores/ui.store';
import { useUpdateMe } from '../../auth';
import { useLogout, useProfile } from '../hooks/useProfile';

/** Stable, readable referral code from the account id ("SS-7K2Q9"). */
export function referralCode(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `SS-${h.toString(36).toUpperCase().padStart(5, '0').slice(-5)}`;
}

const initials = (s: string) => s.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

function Row({ icon, title, sub, children, to }: { icon: string; title: string; sub?: string; children?: ReactNode; to?: string }) {
  const body = (
    <>
      <span className="ph" aria-hidden style={{ width: 40, height: 40, fontSize: 18 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}><b>{title}</b>{sub && <span className="muted" style={{ display: 'block', fontSize: 13 }}>{sub}</span>}</span>
      {children ?? (to && <span aria-hidden className="muted">›</span>)}
    </>
  );
  const style = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: '1px solid var(--line)', color: 'inherit', textDecoration: 'none' } as const;
  return to ? <Link to={to} style={style}>{body}</Link> : <div style={style}>{body}</div>;
}

/** Guest profile (prototype "Profile"): gradient header, then bookings, saved places, payments, language, referral, log out. */
export function ProfilePage() {
  const t = useT();
  const nav = useNavigate();
  const q = useProfile();
  const logout = useLogout();
  const update = useUpdateMe();
  const { lang, setLang, saved, toggleSaved } = usePrefsStore();
  const setBusiness = useTenantStore((s) => s.setBusiness);
  const [editing, setEditing] = useState(false);

  if (q.isLoading) return <Loader />;
  if (q.error || !q.data) return <ErrorMessage error={q.error} onRetry={() => void q.refetch()} />;
  const me = q.data;
  const code = referralCode(me.id);

  const changeLang = (l: Lang) => { setLang(l); update.mutate({ language: l }); };
  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    update.mutate({ name: String(f.get('name') ?? '').trim(), phone: String(f.get('phone') ?? '').trim() }, {
      onSuccess: () => { setEditing(false); toast.success('Details saved'); },
    });
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); toast.success('Referral code copied'); } catch { toast.info(`Your code: ${code}`); }
  };
  const signOut = async () => {
    if (await confirmAction({ title: 'Log out?', message: 'Your cart will be cleared.', confirmLabel: t('logout'), danger: true })) logout.mutate();
  };

  return (
    <div className="stack fd" style={{ maxWidth: 560, margin: '0 auto' }}>
      <section className="hero" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 24 }} aria-label={t('profile.title')}>
        <span className="avatar" style={{ width: 60, height: 60, fontSize: 20, background: 'rgba(255,255,255,.22)' }} aria-hidden>{initials(me.name || me.email)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>{me.name || 'Guest'}</h1>
          <div style={{ opacity: 0.9, overflowWrap: 'anywhere' }}>{me.email}{me.phone ? ` · ${me.phone}` : ''}</div>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditing((v) => !v)}>{editing ? t('cancel') : 'Edit'}</Button>
      </section>

      {editing && (
        <form className="card stack" onSubmit={save}>
          <label><span className="muted">Name</span><input className="input" name="name" defaultValue={me.name ?? ''} maxLength={80} autoComplete="name" /></label>
          <label><span className="muted">Phone</span><input className="input" name="phone" type="tel" defaultValue={me.phone ?? ''} maxLength={20} autoComplete="tel" /></label>
          <Button type="submit" loading={update.isPending}>Save</Button>
        </form>
      )}

      <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
        <Row icon="🧾" title={t('profile.bookings')} sub="Orders, bookings, receipts" to={ROUTES.orders} />
        <Row icon="📍" title={t('profile.saved')} sub={saved.length ? `${saved.length} saved` : 'Tap ☆ on a place to save it'} />
        {saved.map((s) => (
          <div key={s.business_id} className="row" style={{ justifyContent: 'space-between', padding: '6px 4px 6px 56px' }}>
            <button type="button" className="btn ghost sm" onClick={() => { setBusiness(s.business_id, s.city ? `${s.name}, ${s.city}` : s.name); nav(ROUTES.browse); }}>{s.name}{s.city ? `, ${s.city}` : ''}</button>
            <Button size="sm" variant="ghost" aria-label={`Remove ${s.name}`} onClick={() => toggleSaved(s)}>✕</Button>
          </div>
        ))}
        <Row icon="💳" title={t('profile.payments')} sub="UPI, cards or pay at venue — chosen at checkout. Card details stay with Razorpay." />
        <Row icon="🌐" title={t('profile.language')}>
          <select className="input" style={{ width: 'auto' }} value={lang} onChange={(e) => changeLang(e.target.value as Lang)} aria-label={t('profile.language')}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </Row>
        <Row icon="🎁" title={t('profile.refer')} sub={`Share your code ${code} with friends.`}>
          <Button size="sm" variant="secondary" onClick={() => void copy()}>{t('profile.copy')}</Button>
        </Row>
      </div>

      <Button variant="danger" loading={logout.isPending} onClick={() => void signOut()}>{t('logout')}</Button>
    </div>
  );
}

import { Suspense, useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { Loader } from '../components/ui/Loader';
import { ROUTES } from '../config/routes';
import { useT, type TKey } from '../i18n/i18n';
import { AuthOverlay, openAuth, useMe } from '../modules/auth';
import { useCartStore } from '../modules/cart';
import { useAuthStore } from '../stores/auth.store';
import { usePrefsStore } from '../stores/prefs.store';

/** Top-nav shortcuts (prototype: Stays, Food, Parking, Health, Rentals, Shop) → Browse with that booking type. */
const NAV: [string, TKey][] = [['room', 'nav.stays'], ['food', 'nav.food'], ['parking', 'nav.parking'], ['appt', 'nav.health'], ['rental', 'nav.rentals'], ['shop', 'nav.shop']];

/** Applies the theme preference (system / light / dark) to <html data-theme>. */
function useApplyTheme() {
  const theme = usePrefsStore((s) => s.theme);
  useEffect(() => {
    const r = document.documentElement;
    if (theme === 'system') delete r.dataset.theme; else r.dataset.theme = theme;
  }, [theme]);
}

/**
 * Guest web shell (prototype "Guest app → Web app"): sticky top nav with booking-type shortcuts, Scan QR, cart and
 * account; on phones a bottom tab bar (Browse · Scan · Cart · Orders · Profile) like the mobile app.
 */
export function GuestLayout({ children }: { children: ReactNode }) {
  useApplyTheme();
  const t = useT();
  const { pathname } = useLocation();
  const [sp] = useSearchParams();
  const signedIn = useAuthStore((s) => s.signedIn);
  const me = useMe();
  const count = useCartStore((s) => s.lines.length);
  const { theme, setTheme } = usePrefsStore();
  const type = sp.get('type') ?? 'all'; // Browse opens on All: no shortcut is highlighted
  const onBrowse = pathname === ROUTES.browse;
  return (
    <div className="gw">
      <header className="gnav">
        <Link to={ROUTES.browse} className="logo">Stay<b>Serve</b></Link>
        <nav className="gl" aria-label="Booking types">
          {NAV.map(([code, key]) => (
            <Link key={code} to={`${ROUTES.browse}?type=${code}`} className={onBrowse && type === code ? 'on' : ''} aria-current={onBrowse && type === code ? 'page' : undefined}>{t(key)}</Link>
          ))}
        </nav>
        <div className="gnav-actions">
          <Link className="btn secondary sm hide-sm" to={ROUTES.scan}>📷 {t('nav.scanQr')}</Link>
          <Link className="iconbtn cartbadge hide-sm" to={ROUTES.cart} aria-label={`${t('nav.cart')} (${count})`}>🛒{count > 0 && <span className="n">{count}</span>}</Link>
          <button type="button" className="iconbtn" aria-label="Switch theme" title="Theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          {signedIn
            ? <Link to={ROUTES.profile} className="avatar" aria-label={t('nav.profile')}>{(me.data?.name || me.data?.email || '?')[0]?.toUpperCase()}</Link>
            : <button type="button" className="btn sm" onClick={() => openAuth('login')}>{t('nav.login')}</button>}
        </div>
      </header>
      <main id="main">
        <Suspense fallback={<Loader />}>{children}</Suspense>
      </main>
      <nav className="gn" aria-label="Main">
        {([[ROUTES.browse, '🔎', 'nav.browse'], [ROUTES.scan, '📷', 'nav.scan'], [ROUTES.cart, '🛒', 'nav.cart'], [ROUTES.orders, '📋', 'nav.orders'], [ROUTES.profile, '👤', 'nav.profile']] as const).map(([to, icon, key]) => (
          <NavLink key={to} to={to}><span aria-hidden>{icon}</span>{t(key)}{to === ROUTES.cart && count > 0 ? ` (${count})` : ''}</NavLink>
        ))}
      </nav>
      <AuthOverlay />
    </div>
  );
}

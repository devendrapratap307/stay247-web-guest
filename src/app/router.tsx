import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '../components/guards/Guards';
import { ROUTES } from '../config/routes';
import { LoginPage } from '../modules/auth';
import { BrowsePage } from '../modules/browse';
import { ShellRoute } from './ShellRoute';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lz = (f: () => Promise<any>, name: string) => lazy(() => f().then((m) => ({ default: m[name] as React.ComponentType })));
const ScanPage = lz(() => import('../modules/browse'), 'ScanPage');
const QrLandingPage = lz(() => import('../modules/browse'), 'QrLandingPage');
const CartPage = lz(() => import('../modules/cart'), 'CartPage');
const MyOrdersPage = lz(() => import('../modules/order'), 'MyOrdersPage');
const ProfilePage = lz(() => import('../modules/profile'), 'ProfilePage');

/** Browsing, scanning and the cart work signed out; orders and profile ask to sign in (overlay, no redirect). */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route element={<ShellRoute />}>
        <Route index element={<Navigate to={ROUTES.browse} replace />} />
        <Route path="browse" element={<BrowsePage />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="q/:code" element={<QrLandingPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<RequireAuth title="Log in to see your orders"><MyOrdersPage /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="book" element={<Navigate to={ROUTES.browse} replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

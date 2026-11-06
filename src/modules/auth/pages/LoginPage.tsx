import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { toast } from '../../../stores/ui.store';
import { AuthScreens } from '../components/AuthScreens';
import { useAuthDialog } from '../hooks/useAuthDialog';

/** Full-page sign-in for deep links (e.g. a QR opened while signed out); the same screens as the overlay. */
export function LoginPage() {
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  const signedIn = useAuthStore((s) => s.signedIn);
  useEffect(() => { useAuthDialog.getState().go('login'); }, []);
  if (signedIn) return <Navigate to={from} replace />;
  return (
    <main className="auth-wrap">
      <AuthScreens onDone={() => { toast.success('Signed in'); nav(from, { replace: true }); }} />
    </main>
  );
}

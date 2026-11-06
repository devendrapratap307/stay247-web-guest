import { useEffect, type ReactNode } from 'react';
import { openAuth } from '../../modules/auth/hooks/useAuthDialog';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

/** Pages that need an account (orders, profile): guests stay on the page and sign in through the overlay. */
export function RequireAuth({ children, title = 'Log in to continue' }: { children: ReactNode; title?: string }) {
  const signedIn = useAuthStore((s) => s.signedIn);
  useEffect(() => { if (!signedIn) openAuth('login'); }, [signedIn]);
  if (signedIn) return <>{children}</>;
  return <EmptyState title={title} hint="Your cart is kept while you sign in." action={<Button onClick={() => openAuth('login')}>Log in</Button>} />;
}

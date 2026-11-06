import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from '../../../stores/ui.store';
import { useAuthDialog } from '../hooks/useAuthDialog';
import { AuthScreens } from './AuthScreens';

/** Mounted once in the shell; opened with `openAuth()` from the nav, checkout or a guarded page. */
export function AuthOverlay() {
  const { open, close } = useAuthDialog();
  const qc = useQueryClient();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);
  if (!open) return null;
  const done = () => {
    close();
    void qc.invalidateQueries();
    toast.success('Signed in');
  };
  return (
    <div className="authov" role="dialog" aria-modal="true" aria-label="Sign in" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <AuthScreens onDone={done} onClose={close} />
    </div>
  );
}

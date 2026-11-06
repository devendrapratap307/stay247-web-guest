import { useLayoutEffect, useRef } from 'react';
import { useUiStore } from '../../stores/ui.store';

/**
 * Mount once (providers.tsx). Announced to screen readers via aria-live.
 * Modal dialogs (showModal) render in the browser's top layer, above any z-index: the toasts are a manual popover so
 * they live in the top layer too, re-raised on every new toast so they are never hidden behind a dialog or its backdrop.
 */
export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismiss);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof el.showPopover !== 'function') return; // older browsers: plain fixed element
    const raise = () => {
      if (el.matches(':popover-open')) el.hidePopover();
      if (useUiStore.getState().toasts.length) el.showPopover();
    };
    raise();
    // A dialog opened after the toast goes on top of it: raise the toasts again.
    const mo = new MutationObserver((list) => { if (list.some((m) => (m.target as Element).tagName === 'DIALOG' && (m.target as HTMLDialogElement).open)) raise(); });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
    return () => mo.disconnect();
  }, [toasts]);

  return (
    <div ref={ref} popover="manual" className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
          <span>{t.message}</span>
          <button aria-label="Dismiss" onClick={() => dismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

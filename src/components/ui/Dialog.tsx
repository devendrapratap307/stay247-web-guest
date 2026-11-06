import { useEffect, useRef, type ReactNode } from 'react';

interface Props { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }

/** Accessible modal on the native <dialog> element (focus trap, Esc to close, backdrop). */
export function Dialog({ open, title, onClose, children, footer, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={wide ? 'dlg wide' : 'dlg'} aria-labelledby="dlg-title" onClose={onClose} onCancel={onClose}>
      <h2 id="dlg-title">{title}</h2>
      <div>{children}</div>
      {footer && <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>{footer}</div>}
    </dialog>
  );
}

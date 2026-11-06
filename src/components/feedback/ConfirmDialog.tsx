import { useUiStore } from '../../stores/ui.store';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';

/** Mount once (providers.tsx). Open it with `await confirmAction({...})` from ui.store. */
export function ConfirmHost() {
  const c = useUiStore((s) => s.confirm);
  const answer = useUiStore((s) => s.answer);
  return (
    <Dialog
      open={!!c}
      title={c?.title ?? ''}
      onClose={() => answer(false)}
      footer={
        <>
          <Button variant="secondary" onClick={() => answer(false)}>Cancel</Button>
          <Button variant={c?.danger ? 'danger' : 'primary'} onClick={() => answer(true)}>{c?.confirmLabel ?? 'Confirm'}</Button>
        </>
      }
    >
      <p>{c?.message}</p>
    </Dialog>
  );
}

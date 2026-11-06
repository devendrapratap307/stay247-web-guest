import { useQuery } from '@tanstack/react-query';
import { ErrorMessage } from '../../../components/feedback/ErrorMessage';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { Loader } from '../../../components/ui/Loader';
import { toast } from '../../../stores/ui.store';
import { formatMoney } from '../../../utils/currency.utils';
import { printElement } from '../../../utils/print';
import { receiptApi } from '../api/receipt.api';
import { ReceiptPaper } from './ReceiptPaper';

/** Design "Your receipt": the frozen receipt with print (or save as PDF), WhatsApp and copy link. */
export function ReceiptDialog({ doc, onClose }: { doc: { kind: 'order' | 'booking'; id: string } | null; onClose: () => void }) {
  const q = useQuery({ queryKey: ['receipt', doc?.kind, doc?.id], queryFn: () => receiptApi.get(doc!.kind, doc!.id), enabled: !!doc });
  const r = q.data;
  const text = r ? `${r.business.name}: ${r.number} · ${formatMoney(r.total_minor)}` : '';
  return (
    <Dialog open={!!doc} title="Your receipt" onClose={onClose} wide
      footer={<>
        <Button variant="secondary" disabled={!r} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')}>WhatsApp</Button>
        <Button variant="secondary" disabled={!r} onClick={async () => { try { await navigator.clipboard.writeText(text); toast.success('Copied'); } catch { toast.error('Copy is blocked here'); } }}>Copy</Button>
        <Button disabled={!r} onClick={() => { const paper = document.querySelector('.printable .paper'); if (paper && r) printElement(paper, `Receipt ${r.number}`); }}>🖨 Print / PDF</Button>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </>}>
      {q.error ? <ErrorMessage error={q.error} onRetry={() => void q.refetch()} /> : !r ? <Loader /> : (
        <div className="printable" style={{ overflow: 'auto' }}>
          <ReceiptPaper r={r} o={{ template: r.template, stamp: '', signature: false, computerGenerated: true, paper: 'A5' }} />
        </div>
      )}
    </Dialog>
  );
}

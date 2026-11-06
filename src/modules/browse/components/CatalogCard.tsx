import { Button } from '../../../components/ui/Button';
import { useT } from '../../../i18n/i18n';
import { formatMoney } from '../../../utils/currency.utils';
import { PRICE_UNIT, typeIcon } from '../config/booking-types';
import type { CatalogEntry } from '../types/browse.types';

interface Props {
  entry: CatalogEntry;
  /** Quantity already in the cart (items only). */
  qty: number;
  selected?: boolean;
  onAdd: () => void;
  onQty: (qty: number) => void;
  onBook: () => void;
}

/** Grid card (prototype .gc): gradient image area, name, price with unit, and Add / − n + or Book. */
export function CatalogCard({ entry, qty, selected, onAdd, onQty, onBook }: Props) {
  const t = useT();
  const unit = PRICE_UNIT[entry.type];
  return (
    <article className={`card gc ${entry.available ? '' : 'na'}`} aria-label={entry.name} style={selected ? { borderColor: 'var(--brand)' } : undefined}>
      <div className="im" aria-hidden>{entry.image ? <img src={entry.image} alt="" loading="lazy" /> : typeIcon(entry.type)}</div>
      <div className="bd">
        <b>{entry.name}</b>
        <div className="row">
          <span>{formatMoney(entry.price_minor)} {unit && <span className="muted">{unit}</span>}</span>
          {!entry.available ? <span className="chip bad">{t('unavailable')}</span>
            : entry.kind === 'resource' ? <Button size="sm" onClick={onBook}>{t('book')}</Button>
              : qty > 0 ? (
                <span className="qty">
                  <Button size="sm" variant="secondary" aria-label={`Decrease ${entry.name}`} onClick={() => onQty(qty - 1)}>−</Button>
                  <span aria-label={`${entry.name} quantity`}>{qty}</span>
                  <Button size="sm" aria-label={`Increase ${entry.name}`} onClick={() => onQty(qty + 1)}>+</Button>
                </span>
              ) : <Button size="sm" onClick={onAdd}>{t('add')}</Button>}
        </div>
      </div>
    </article>
  );
}

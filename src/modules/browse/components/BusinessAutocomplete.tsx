import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useT } from '../../../i18n/i18n';
import { typeIcon } from '../config/booking-types';
import { useLocations } from '../hooks/useBrowse';
import type { GuestLocation } from '../types/browse.types';

interface Props {
  /** Shown in the box when not typing (the current place). */
  value: string;
  onPick: (l: GuestLocation) => void;
}

/**
 * Business search (ARIA combobox): type a name, company, city or address and pick from every business that is shown to
 * guests, whatever it offers. ↑ / ↓ move, Enter picks, Esc closes.
 */
export function BusinessAutocomplete({ value, onPick }: Props) {
  const t = useT();
  const id = useId();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const found = useLocations(text.trim(), '', '', open);
  const rows = found.data ?? [];
  useEffect(() => setActive(0), [text]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = (l: GuestLocation) => { onPick(l); setText(''); setOpen(false); };
  const keys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(rows.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter' && open && rows[active]) { e.preventDefault(); pick(rows[active]); }
    else if (e.key === 'Escape') { setOpen(false); setText(''); }
  };

  return (
    <div className="ac" ref={box}>
      <input
        className="input"
        role="combobox"
        aria-label={t('hero.business')}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && rows[active] ? `${id}-${active}` : undefined}
        placeholder={value || t('hero.businessSearch')}
        value={open ? text : value}
        onFocus={() => { setOpen(true); setText(''); }}
        onChange={(e) => { setText(e.target.value); setOpen(true); }}
        onKeyDown={keys}
      />
      {open && (
        <ul className="ac-list" id={`${id}-list`} role="listbox" aria-label={t('hero.business')}>
          {found.isLoading && <li className="ac-empty">Searching…</li>}
          {!found.isLoading && !rows.length && <li className="ac-empty">{text ? `No business matches “${text}”` : 'No businesses yet'}</li>}
          {rows.map((l, i) => (
            <li key={l.business_id} id={`${id}-${i}`} role="option" aria-selected={i === active} className={i === active ? 'on' : ''}
              onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(l); }}>
              <b>{l.name}</b>
              <span className="muted">{[l.company_name && l.company_name !== l.name ? l.company_name : '', l.city, l.address].filter(Boolean).join(' · ')}</span>
              {l.types.length > 0 && <span className="ac-types" aria-label={`Offers ${l.types.join(', ')}`}>{l.types.slice(0, 6).map((c) => <span key={c} aria-hidden>{typeIcon(c)}</span>)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

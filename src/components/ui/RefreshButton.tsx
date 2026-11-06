import { useEffect, useState } from 'react';
import { useT } from '../../i18n/i18n';
import { usePrefsStore } from '../../stores/prefs.store';
import { ago } from '../../utils/ago';
import { Button } from './Button';

/** Re-renders every second so "updated … ago" stays current. */
function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/** "↻ Refresh" with how long ago the list was last loaded (live timer); spins while reloading. */
export function RefreshButton({ onRefresh, updatedAt, refreshing }: { onRefresh: () => void; updatedAt: number; refreshing?: boolean }) {
  const t = useT();
  const now = useNow();
  const lang = usePrefsStore((s) => s.lang);
  const when = ago(updatedAt, now, lang === 'hi' ? 'hi' : 'en');
  return (
    <span className="refresh">
      <Button size="sm" variant="secondary" loading={refreshing} onClick={onRefresh} aria-label={t('refresh')}>↻ {t('refresh')}</Button>
      {when && <span className="muted" style={{ fontSize: 12 }} title={new Date(updatedAt).toLocaleTimeString()}>{t('updated')} {when}</span>}
    </span>
  );
}

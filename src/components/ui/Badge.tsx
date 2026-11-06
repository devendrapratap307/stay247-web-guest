import { clsx } from '../../utils/format.utils';

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'danger' | 'warning'; children: string }) {
  return <span className={clsx('badge-pill', tone !== 'neutral' && tone)}>{children}</span>;
}

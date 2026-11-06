import { Button } from './Button';

/** Cursor pagination control: "Load more" + count (keyset pages have no total or page numbers). */
export function Pagination({ shown, hasMore, loading, onMore }: { shown: number; hasMore: boolean; loading: boolean; onMore: () => void }) {
  return (
    <div className="row" style={{ justifyContent: 'center', margin: '16px 0' }}>
      <span className="muted">{shown} shown</span>
      {hasMore && <Button variant="secondary" loading={loading} onClick={onMore}>Load more</Button>}
    </div>
  );
}

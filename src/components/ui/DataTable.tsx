import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { Loader } from './Loader';

export interface Column<T> { key: string; header: string; cell: (row: T) => ReactNode; align?: 'right' }

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  /** Line-item mode: shows a remove (✕) button at the top-right of each card / end of each row. Listing pages omit it. */
  onRemove?: (row: T) => void;
  onRowClick?: (row: T) => void;
}

/** Table on large screens; numbered cards (number top-left, optional ✕ top-right) on small screens. */
export function DataTable<T>({ rows, columns, rowKey, loading, emptyTitle = 'Nothing here yet', onRemove, onRowClick }: Props<T>) {
  if (loading) return <Loader />;
  if (!rows.length) return <EmptyState title={emptyTitle} />;
  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              {columns.map((c) => <th key={c.key} style={{ textAlign: c.align }}>{c.header}</th>)}
              {onRemove && <th style={{ width: 48 }} aria-label="Remove" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
                <td className="muted">{i + 1}</td>
                {columns.map((c) => <td key={c.key} style={{ textAlign: c.align }}>{c.cell(r)}</td>)}
                {onRemove && <td><button className="btn ghost sm" aria-label="Remove line" onClick={(e) => { e.stopPropagation(); onRemove(r); }}>✕</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cardlist">
        {rows.map((r, i) => (
          <div key={rowKey(r)} className="cardrow" onClick={onRowClick ? () => onRowClick(r) : undefined}>
            <span className="num">{i + 1}</span>
            {onRemove && <button className="x" aria-label="Remove line" onClick={(e) => { e.stopPropagation(); onRemove(r); }}>✕</button>}
            {columns.map((c) => <div key={c.key} className="kv"><span>{c.header}</span><span>{c.cell(r)}</span></div>)}
          </div>
        ))}
      </div>
    </>
  );
}

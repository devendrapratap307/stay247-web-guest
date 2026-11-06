import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

const rows = [{ id: 'a', name: 'Tea' }, { id: 'b', name: 'Coffee' }];
type Row = { id: string; name: string };
const cols = [{ key: 'name', header: 'Name', cell: (r: Row) => r.name }];

describe('DataTable', () => {
  it('shows the empty state', () => {
    render(<DataTable rows={[]} columns={cols} rowKey={(r: Row) => r.id} emptyTitle="Nothing" />);
    expect(screen.getByText('Nothing')).toBeInTheDocument();
  });
  it('numbers rows and exposes a remove button per line only when onRemove is given', () => {
    const onRemove = vi.fn();
    const { container } = render(<DataTable rows={rows} columns={cols} rowKey={(r) => r.id} onRemove={onRemove} />);
    expect(container.querySelectorAll('.cardrow .num')).toHaveLength(2);
    fireEvent.click(container.querySelectorAll<HTMLButtonElement>('.cardrow .x')[1]!);
    expect(onRemove).toHaveBeenCalledWith(rows[1]);
  });
  it('has no remove controls on listing pages', () => {
    const { container } = render(<DataTable rows={rows} columns={cols} rowKey={(r) => r.id} />);
    expect(container.querySelector('.cardrow .x')).toBeNull();
  });
});

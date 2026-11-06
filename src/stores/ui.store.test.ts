import { describe, expect, it } from 'vitest';
import { confirmAction, toast, useUiStore } from './ui.store';

describe('ui store', () => {
  it('queues toasts', () => {
    toast.error('boom');
    expect(useUiStore.getState().toasts.at(-1)).toMatchObject({ kind: 'error', message: 'boom' });
  });
  it('resolves confirmation promises', async () => {
    const p = confirmAction({ title: 't', message: 'm' });
    useUiStore.getState().answer(true);
    await expect(p).resolves.toBe(true);
  });
});

import { create } from 'zustand';
import { TOAST_MS } from '../config/constants';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';
export interface ToastItem { id: number; kind: ToastKind; message: string }

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

interface UiState {
  toasts: ToastItem[];
  confirm: ConfirmRequest | null;
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
  ask: (c: Omit<ConfirmRequest, 'resolve'>) => Promise<boolean>;
  answer: (ok: boolean) => void;
}

let seq = 0;

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  confirm: null,
  push: (kind, message) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, message }] }));
    setTimeout(() => get().dismiss(id), TOAST_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  ask: (c) => new Promise<boolean>((resolve) => set({ confirm: { ...c, resolve } })),
  answer: (ok) => {
    get().confirm?.resolve(ok);
    set({ confirm: null });
  },
}));

/** Imperative toast API usable anywhere (hooks, query callbacks). */
export const toast = {
  success: (m: string) => useUiStore.getState().push('success', m),
  error: (m: string) => useUiStore.getState().push('error', m),
  info: (m: string) => useUiStore.getState().push('info', m),
  warning: (m: string) => useUiStore.getState().push('warning', m),
};

/** Promise-based confirmation: `if (await confirmAction({...})) doIt()`. */
export const confirmAction = (c: Omit<ConfirmRequest, 'resolve'>) => useUiStore.getState().ask(c);

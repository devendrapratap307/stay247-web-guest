import { create } from 'zustand';
import type { AuthScreen } from '../types/auth.types';

// The sign-in overlay is opened from anywhere (nav "Log in", checkout, guarded pages) and closes itself on success.
interface AuthDialogState {
  open: boolean;
  screen: AuthScreen;
  /** Email carried between steps (signup → verify, forgot → code → reset). */
  email: string;
  /** Reset code collected on "Enter the code", sent with the new password. */
  code: string;
  show: (screen?: AuthScreen) => void;
  go: (screen: AuthScreen, patch?: Partial<Pick<AuthDialogState, 'email' | 'code'>>) => void;
  close: () => void;
}

export const useAuthDialog = create<AuthDialogState>((set) => ({
  open: false,
  screen: 'login',
  email: '',
  code: '',
  show: (screen = 'login') => set({ open: true, screen }),
  go: (screen, patch) => set({ screen, ...patch }),
  close: () => set({ open: false, code: '' }),
}));

export const openAuth = (screen: AuthScreen = 'login') => useAuthDialog.getState().show(screen);

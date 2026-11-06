import { create } from 'zustand';

// Access token lives in memory only (not readable after a reload, not stealable from storage).
// The refresh token is kept in sessionStorage so a reload keeps the session; it is rotated on every use.
const RT_KEY = 'ss.refresh';
const read = () => { try { return sessionStorage.getItem(RT_KEY); } catch { return null; } };
const write = (v: string | null) => { try { v ? sessionStorage.setItem(RT_KEY, v) : sessionStorage.removeItem(RT_KEY); } catch { /* storage blocked */ } };

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  signedIn: boolean;
  setTokens: (access: string, refresh: string) => void;
  setAccess: (access: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: read(),
  signedIn: !!read(),
  setTokens: (accessToken, refreshToken) => { write(refreshToken); set({ accessToken, refreshToken, signedIn: true }); },
  setAccess: (accessToken) => set({ accessToken }),
  clear: () => { write(null); set({ accessToken: null, refreshToken: null, signedIn: false }); },
}));

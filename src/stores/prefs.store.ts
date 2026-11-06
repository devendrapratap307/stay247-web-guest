import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Per-device preferences (no secrets): theme, language and the guest's saved locations.
export type Theme = 'system' | 'light' | 'dark';
export type Lang = 'en' | 'hi';
export interface SavedLocation { business_id: string; name: string; city?: string }

interface PrefsState {
  theme: Theme;
  lang: Lang;
  saved: SavedLocation[];
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  toggleSaved: (l: SavedLocation) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'system',
      lang: 'en',
      saved: [],
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      toggleSaved: (l) => set((s) => ({
        saved: s.saved.some((x) => x.business_id === l.business_id) ? s.saved.filter((x) => x.business_id !== l.business_id) : [...s.saved, l].slice(-20),
      })),
    }),
    { name: 'ss.prefs', storage: createJSONStorage(() => localStorage) },
  ),
);

/** Applies the theme to <html data-theme> (CSS tokens switch on it); "system" removes it so the OS setting wins. */
export function applyTheme(t: Theme) {
  const el = document.documentElement;
  if (t === 'system') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', t);
}

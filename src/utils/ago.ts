const WORDS = {
  en: { now: 'just now', s: (n: number) => `${n}s ago`, m: (n: number) => `${n} min ago`, h: (n: number) => `${n} h ago`, d: (n: number) => `${n} d ago` },
  hi: { now: 'अभी', s: (n: number) => `${n} सेकंड पहले`, m: (n: number) => `${n} मिनट पहले`, h: (n: number) => `${n} घंटे पहले`, d: (n: number) => `${n} दिन पहले` },
};

/** "just now", "25s ago", "3 min ago", "2 h ago" — how long since `at` (ms epoch); "" when never. */
export function ago(at: number, now = Date.now(), lang: 'en' | 'hi' = 'en'): string {
  if (!at) return '';
  const w = WORDS[lang] ?? WORDS.en;
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 5) return w.now;
  if (s < 60) return w.s(s);
  const m = Math.floor(s / 60);
  if (m < 60) return w.m(m);
  const h = Math.floor(m / 60);
  return h < 24 ? w.h(h) : w.d(Math.floor(h / 24));
}

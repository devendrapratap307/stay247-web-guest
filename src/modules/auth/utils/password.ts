/** 0–4 score used by the strength bar on "Create account" and "Set a new password". */
export function passwordScore(p: string): number {
  return [p.length >= 8, /\d/.test(p), /[^A-Za-z0-9]/.test(p), /[A-Z]/.test(p)].filter(Boolean).length;
}
export const SCORE_LABEL = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
export const SCORE_COLOR = ['var(--danger)', 'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--success)'] as const;

/** a***@example.com */
export const maskEmail = (e: string) => e.replace(/^(.).*(@.*)$/, '$1***$2');

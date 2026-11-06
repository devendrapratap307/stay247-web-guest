export const titleCase = (s: string) => s.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const newIdempotencyKey = () => crypto.randomUUID();
export const clsx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(' ');

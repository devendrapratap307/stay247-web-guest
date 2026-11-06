import { z } from 'zod';

// QR codes are URL-safe tokens; reject anything else before it reaches the API or the URL.
export const codeSchema = z.object({ code: z.string().trim().min(4, 'Enter the code printed under the QR').max(64).regex(/^[A-Za-z0-9_-]+$/, 'Only letters, numbers, - and _') });
export type CodeForm = z.infer<typeof codeSchema>;

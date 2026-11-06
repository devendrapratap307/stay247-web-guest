import { z } from 'zod';

// Validated once at start-up so a bad deploy fails loudly instead of at the first request.
const schema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_APP_ENV: z.enum(['local', 'dev', 'prod']),
  VITE_APP_AUDIENCE: z.enum(['host', 'guest']),
});

const parsed = schema.safeParse(import.meta.env);
if (!parsed.success) {
  throw new Error('Invalid environment configuration: ' + parsed.error.issues.map((i) => i.path.join('.')).join(', '));
}

export const env = {
  apiUrl: parsed.data.VITE_API_URL.replace(/\/$/, ''),
  appEnv: parsed.data.VITE_APP_ENV,
  isProd: parsed.data.VITE_APP_ENV === 'prod',
};

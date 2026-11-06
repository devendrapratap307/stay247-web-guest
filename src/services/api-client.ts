import { env } from '../config/env';
import { useAuthStore } from '../stores/auth.store';
import { useTenantStore } from '../stores/tenant.store';
import type { ApiErrorBody, Envelope } from '../types/api.types';
import type { Page, PageParams } from '../types/pagination.types';
import { ApiError } from './api-error';

const APP = import.meta.env.VITE_APP_AUDIENCE as 'host' | 'guest';

export interface TokenPair { access_token: string; refresh_token: string }

let refreshing: Promise<boolean> | null = null;

/** Single-flight refresh: concurrent 401s share one rotation (refresh tokens are one-time use). */
async function refresh(): Promise<boolean> {
  const rt = useAuthStore.getState().refreshToken;
  if (!rt) return false;
  refreshing ??= fetch(`${env.apiUrl}/api/v1/auth/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: rt }),
  })
    .then(async (r) => {
      if (!r.ok) return false;
      const { data } = (await r.json()) as Envelope<{ access_token: string; refresh_token: string }>;
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      return true;
    })
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

interface Options { method?: string; body?: unknown; params?: Record<string, string | number | undefined>; auth?: boolean; idempotencyKey?: string }

async function raw(path: string, o: Options, retry = true): Promise<Response> {
  const auth = o.auth !== false;
  if (auth && !useAuthStore.getState().accessToken && !(await refresh())) {
    useAuthStore.getState().clear();
    throw new ApiError(401, 'unauthorized', 'Please sign in to continue');
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const { accessToken } = useAuthStore.getState();
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const bid = useTenantStore.getState().businessId;
  if (bid) headers['X-Business-Id'] = bid;
  if (o.idempotencyKey) headers['Idempotency-Key'] = o.idempotencyKey;

  const qs = o.params ? '?' + new URLSearchParams(Object.entries(o.params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString() : '';
  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}/api/v1${path}${qs}`, { method: o.method ?? 'GET', headers, body: o.body !== undefined ? JSON.stringify(o.body) : undefined });
  } catch {
    throw new ApiError(0, 'network', 'Cannot reach the server. Check your connection and try again.');
  }
  if (res.status === 401 && auth && retry) {
    useAuthStore.getState().setAccess('');
    useAuthStore.setState({ accessToken: null });
    if (await refresh()) return raw(path, o, false);
    useAuthStore.getState().clear();
  }
  return res;
}

async function parse<T>(res: Response): Promise<Envelope<T>> {
  if (res.status === 204) return { data: undefined as T };
  const body = (await res.json().catch(() => ({}))) as Partial<Envelope<T>> & Partial<ApiErrorBody>;
  if (!res.ok) {
    throw new ApiError(res.status, body.error?.code ?? 'error', body.error?.message ?? 'Something went wrong', body.error?.fields);
  }
  return body as Envelope<T>;
}

export const api = {
  audience: APP,
  /** `auth: false` sends no token (public discovery endpoints work signed out). */
  async get<T>(path: string, params?: Options['params'], o: Pick<Options, 'auth'> = {}): Promise<T> { return (await parse<T>(await raw(path, { params, ...o }))).data; },
  async post<T>(path: string, body?: unknown, o: Pick<Options, 'idempotencyKey' | 'auth'> = {}): Promise<T> {
    return (await parse<T>(await raw(path, { method: 'POST', body: body ?? {}, ...o }))).data;
  },
  async patch<T>(path: string, body?: unknown): Promise<T> { return (await parse<T>(await raw(path, { method: 'PATCH', body: body ?? {} }))).data; },
  async list<T>(path: string, p: PageParams = {}): Promise<Page<T>> {
    const env_ = await parse<T[]>(await raw(path, { params: p }));
    return { items: env_.data ?? [], nextCursor: env_.meta?.next_cursor ?? 0 };
  },
  /** Conditional GET used by bootstrap (ETag → 304). */
  async getWithEtag<T>(path: string, params: Options['params'], etag?: string): Promise<{ data: T; etag: string } | null> {
    const res = await raw(path, { params });
    void etag;
    if (res.status === 304) return null;
    return { data: (await parse<T>(res)).data, etag: res.headers.get('ETag') ?? '' };
  },
  async otpRequest(email: string) { return this.post<{ status: string }>('/auth/otp/request', { email }, { auth: false }); },
  async otpVerify(email: string, code: string) {
    this.startSession(await this.post<TokenPair>('/auth/otp/verify', { email, code, app: APP }, { auth: false }));
  },
  /** Stores a token pair returned by any sign-in endpoint (OTP, password, email verification). */
  startSession(t: TokenPair) { useAuthStore.getState().setTokens(t.access_token, t.refresh_token); },
  async logout() {
    const rt = useAuthStore.getState().refreshToken;
    try { await this.post('/auth/logout', { refresh_token: rt }); } catch { /* already invalid */ }
    useAuthStore.getState().clear();
  },
};

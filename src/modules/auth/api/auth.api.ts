import { api, type TokenPair } from '../../../services/api-client';
import type { Me, RegisterResult, UpdateMeBody } from '../types/auth.types';

const app = api.audience;

export const authApi = {
  requestOtp: (email: string) => api.otpRequest(email),
  verifyOtp: (email: string, code: string) => api.otpVerify(email, code),
  me: () => api.get<Me>('/auth/me'),
  updateMe: (b: UpdateMeBody) => api.patch<Me>('/auth/me', b),
  logout: () => api.logout(),
  async login(email: string, password: string) { api.startSession(await api.post<TokenPair>('/auth/login', { email, password, app }, { auth: false })); },
  register: (name: string, email: string, password: string) => api.post<RegisterResult>('/auth/register', { name, email, password, app }, { auth: false }),
  async verifyEmail(email: string, code: string) { api.startSession(await api.post<TokenPair>('/auth/email/verify', { email, code, app }, { auth: false })); },
  resendEmail: (email: string) => api.post<void>('/auth/email/resend', { email }, { auth: false }),
  forgotPassword: (email: string) => api.post<void>('/auth/password/forgot', { email }, { auth: false }),
  resetPassword: (email: string, code: string, new_password: string) => api.post<void>('/auth/password/reset', { email, code, new_password }, { auth: false }),
};

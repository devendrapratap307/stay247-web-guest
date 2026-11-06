import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { useAuthStore } from '../../../stores/auth.store';
import { useTenantStore } from '../../../stores/tenant.store';
import { toast } from '../../../stores/ui.store';
import { useCartStore } from '../../cart/hooks/useCartStore';
import { authApi } from '../api/auth.api';
import type { UpdateMeBody } from '../types/auth.types';

export function useMe() {
  const signedIn = useAuthStore((s) => s.signedIn);
  return useQuery({ queryKey: ['me'], queryFn: authApi.me, enabled: signedIn, staleTime: 60_000 });
}

// Auth forms show their own inline errors, so these mutations are silent (no global toast).
export const useRequestOtp = () => useMutation({ mutationFn: authApi.requestOtp, meta: { silent: true } });
export const useVerifyOtp = () => useMutation({ mutationFn: (v: { email: string; code: string }) => authApi.verifyOtp(v.email, v.code), meta: { silent: true } });
export const useLogin = () => useMutation({ mutationFn: (v: { email: string; password: string }) => authApi.login(v.email, v.password), meta: { silent: true } });
export const useRegister = () => useMutation({ mutationFn: (v: { name: string; email: string; password: string }) => authApi.register(v.name, v.email, v.password), meta: { silent: true } });
export const useVerifyEmail = () => useMutation({ mutationFn: (v: { email: string; code: string }) => authApi.verifyEmail(v.email, v.code), meta: { silent: true } });
export const useResendEmail = () => useMutation({ mutationFn: authApi.resendEmail, meta: { silent: true } });
export const useForgotPassword = () => useMutation({ mutationFn: authApi.forgotPassword, meta: { silent: true } });
export const useResetPassword = () => useMutation({ mutationFn: (v: { email: string; code: string; password: string }) => authApi.resetPassword(v.email, v.code, v.password), meta: { silent: true } });

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: UpdateMeBody) => authApi.updateMe(b),
    onSuccess: (me) => { qc.setQueryData(['me'], me); },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const nav = useNavigate();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      useTenantStore.getState().clear();
      useCartStore.getState().clear();
      qc.clear();
      toast.info('You have been signed out');
      nav(ROUTES.browse, { replace: true });
    },
  });
}

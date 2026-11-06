import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import { appconfigApi } from '../api/appconfig.api';

/** Menus and booking types come from the database (not hard-coded) so they can change without a redeploy. */
export function useBootstrap(businessType?: string) {
  const signedIn = useAuthStore((s) => s.signedIn);
  return useQuery({ queryKey: ['bootstrap', businessType ?? ''], queryFn: () => appconfigApi.bootstrap(businessType), enabled: signedIn, staleTime: 5 * 60_000 });
}

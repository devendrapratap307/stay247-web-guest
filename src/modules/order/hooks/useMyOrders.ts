import { usePagination } from '../../../hooks/usePagination';
import { useAuthStore } from '../../../stores/auth.store';
import { orderApi } from '../api/order.api';

/** My orders across every business, newest first. */
export function useMyOrders() {
  const signedIn = useAuthStore((s) => s.signedIn);
  return usePagination(['my-orders'], (c, l) => orderApi.mine(c, l), { enabled: signedIn });
}

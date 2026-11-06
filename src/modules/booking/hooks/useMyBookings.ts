import { usePagination } from '../../../hooks/usePagination';
import { useAuthStore } from '../../../stores/auth.store';
import { bookingApi } from '../api/booking.api';

export function useMyBookings() {
  const signedIn = useAuthStore((s) => s.signedIn);
  return usePagination(['my-bookings'], (c, l) => bookingApi.mine(c, l), { enabled: signedIn });
}

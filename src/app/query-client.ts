import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, errorMessage } from '../services/api-error';
import { toast } from '../stores/ui.store';

// Global failure alerts: any failed mutation shows an error toast (unless it is a 422 the form already shows inline).
// Queries only toast on background-refetch failures so pages can render their own <ErrorMessage/>.
export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (e, q) => { if (q.state.data !== undefined) toast.error(errorMessage(e)); } }),
  mutationCache: new MutationCache({
    onError: (e, _v, _c, m) => {
      if (m.options.meta?.silent) return;
      if (e instanceof ApiError && e.isValidation) return;
      toast.error(errorMessage(e));
    },
  }),
  defaultOptions: {
    queries: { staleTime: 15_000, retry: (n, e) => !(e instanceof ApiError && e.status < 500 && e.status !== 0) && n < 2, refetchOnWindowFocus: false },
  },
});

declare module '@tanstack/react-query' {
  interface Register { mutationMeta: { silent?: boolean } }
}

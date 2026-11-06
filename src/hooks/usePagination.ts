import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import { PAGE_SIZE } from '../config/constants';
import type { Page } from '../types/pagination.types';

/** Cursor (keyset) pagination on top of useInfiniteQuery: `rows`, `hasMore`, `loadMore`. */
export function usePagination<T>(key: QueryKey, fetchPage: (cursor: number, limit: number) => Promise<Page<T>>, opts: { enabled?: boolean; limit?: number } = {}) {
  const limit = opts.limit ?? PAGE_SIZE;
  const q = useInfiniteQuery({
    queryKey: key,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchPage(pageParam, limit),
    getNextPageParam: (last) => (last.nextCursor ? last.nextCursor : undefined),
    enabled: opts.enabled ?? true,
  });
  return {
    rows: q.data?.pages.flatMap((p) => p.items) ?? [],
    hasMore: !!q.hasNextPage,
    loadMore: () => void q.fetchNextPage(),
    isLoading: q.isPending,
    isFetchingMore: q.isFetchingNextPage,
    error: q.error,
    refetch: q.refetch,
    /** when the list was last loaded (ms epoch, 0 = never) and whether a reload is running (not the first load or "more") */
    updatedAt: q.dataUpdatedAt,
    isRefreshing: q.isFetching && !q.isPending && !q.isFetchingNextPage,
  };
}

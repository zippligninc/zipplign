// Optimized data fetching hooks for better performance
import { useState, useEffect, useCallback, useRef } from 'react';
import { errorHandler } from '@/lib/error-handler';

interface UseOptimizedDataOptions<T> {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

interface UseOptimizedDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (data: T) => void;
}

export function useOptimizedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseOptimizedDataOptions<T> = {}
): UseOptimizedDataReturn<T> {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    retry = 3,
    retryDelay = 1000,
    onError,
    onSuccess,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const retryCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    const now = Date.now();
    const isStale = now - lastFetch > staleTime;

    if (!force && data && !isStale) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setLastFetch(now);
      retryCountRef.current = 0;
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => fetchData(force), retryDelay * retryCountRef.current);
      } else {
        errorHandler.handleError(error, 'Data Fetch');
        onError?.(error);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, fetcher, staleTime, lastFetch, data, retry, retryDelay, onError, onSuccess]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
    setLastFetch(Date.now());
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
  };
}

// Hook for paginated data
export function usePaginatedData<T>(
  key: string,
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean; total?: number }>,
  options: UseOptimizedDataOptions<{ data: T[]; hasMore: boolean; total?: number }> & {
    pageSize?: number;
  } = {}
) {
  const { pageSize = 20, ...restOptions } = options;
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | undefined>();

  const { data, loading, error, refetch } = useOptimizedData(
    `${key}_page_${page}`,
    () => fetcher(page, pageSize),
    {
      ...restOptions,
      onSuccess: (result) => {
        if (page === 1) {
          setAllData(result.data);
        } else {
          setAllData(prev => [...prev, ...result.data]);
        }
        setHasMore(result.hasMore);
        setTotal(result.total);
        restOptions.onSuccess?.(result);
      },
    }
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
    setTotal(undefined);
    refetch();
  }, [refetch]);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    reset,
    refetch,
  };
}

// Hook for infinite scroll data
export function useInfiniteData<T>(
  key: string,
  fetcher: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string }>,
  options: UseOptimizedDataOptions<{ data: T[]; nextCursor?: string }> = {}
) {
  const [allData, setAllData] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);

  const { data, loading, error, refetch } = useOptimizedData(
    `${key}_cursor_${cursor || 'initial'}`,
    () => fetcher(cursor),
    {
      ...options,
      onSuccess: (result) => {
        if (!cursor) {
          setAllData(result.data);
        } else {
          setAllData(prev => [...prev, ...result.data]);
        }
        setCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
        options.onSuccess?.(result);
      },
    }
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading && cursor) {
      setCursor(cursor);
    }
  }, [hasMore, loading, cursor]);

  const reset = useCallback(() => {
    setAllData([]);
    setCursor(undefined);
    setHasMore(true);
    refetch();
  }, [refetch]);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refetch,
  };
}

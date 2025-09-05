'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce, useCache } from './use-performance';

// Optimized fetch hook with caching, debouncing, and error handling
export function useOptimizedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    cacheTime?: number;
    staleTime?: number;
    retry?: number;
    retryDelay?: number;
  } = {}
) {
  const {
    enabled = true,
    refetchInterval,
    cacheTime = 300000, // 5 minutes
    staleTime = 60000, // 1 minute
    retry = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number>(0);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache management
  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(`optimized_cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < cacheTime) {
          return { data, isStale: age > staleTime };
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }, [key, cacheTime, staleTime]);

  const setCachedData = useCallback((data: T) => {
    try {
      localStorage.setItem(`optimized_cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }, [key]);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled && !force) return;

    // Check cache first
    const cached = getCachedData();
    if (cached && !force) {
      setData(cached.data);
      if (!cached.isStale) {
        return cached.data;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    retryCountRef.current = 0;

    const attemptFetch = async (): Promise<T> => {
      try {
        const result = await fetcher();
        setData(result);
        setCachedData(result);
        setLastFetched(Date.now());
        retryCountRef.current = 0;
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        
        if (retryCountRef.current < retry) {
          retryCountRef.current++;
          console.warn(`Fetch attempt ${retryCountRef.current} failed, retrying...`, error);
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCountRef.current));
          return attemptFetch();
        }
        
        throw error;
      }
    };

    try {
      const result = await attemptFetch();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      // Return cached data if available as fallback
      if (cached) {
        setData(cached.data);
        return cached.data;
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enabled, fetcher, getCachedData, setCachedData, retry, retryDelay]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  // Refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(() => {
        fetchData();
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [refetchInterval, enabled, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    isStale: lastFetched > 0 && (Date.now() - lastFetched) > staleTime
  };
}

// Pagination hook with optimized loading
export function usePaginatedFetch<T>(
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean; total?: number }>,
  options: {
    limit?: number;
    enabled?: boolean;
    cachePages?: boolean;
  } = {}
) {
  const { limit = 20, enabled = true, cachePages = true } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | undefined>();
  
  const pagesCacheRef = useRef<Map<number, T[]>>(new Map());

  const fetchPage = useCallback(async (pageNumber: number, append = false) => {
    if (!enabled) return;

    // Check cache
    if (cachePages && pagesCacheRef.current.has(pageNumber)) {
      const cachedData = pagesCacheRef.current.get(pageNumber)!;
      if (append) {
        setData(prev => [...prev, ...cachedData]);
      } else {
        setData(cachedData);
      }
      return;
    }

    const isFirstPage = pageNumber === 1;
    if (isFirstPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    setError(null);

    try {
      const result = await fetcher(pageNumber, limit);
      
      // Cache the page
      if (cachePages) {
        pagesCacheRef.current.set(pageNumber, result.data);
      }

      if (append) {
        setData(prev => [...prev, ...result.data]);
      } else {
        setData(result.data);
      }
      
      setHasMore(result.hasMore);
      setTotal(result.total);
      setPage(pageNumber);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [enabled, fetcher, limit, cachePages]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      fetchPage(page + 1, true);
    }
  }, [hasMore, loadingMore, page, fetchPage]);

  const refresh = useCallback(() => {
    pagesCacheRef.current.clear();
    setPage(1);
    setData([]);
    setHasMore(true);
    fetchPage(1, false);
  }, [fetchPage]);

  useEffect(() => {
    if (enabled) {
      fetchPage(1, false);
    }
  }, [fetchPage, enabled]);

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
    currentPage: page
  };
}

// Optimized search hook with debouncing
export function useOptimizedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  debounceMs = 300,
  minQueryLength = 2
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const debouncedQuery = useDebounce(query, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debouncedQuery.length < minQueryLength) {
      setResults([]);
      setError(null);
      return;
    }

    const performSearch = async () => {
      // Cancel previous search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const searchResults = await searchFn(debouncedQuery);
        setResults(searchResults);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        const error = err instanceof Error ? err : new Error('Search failed');
        setError(error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, searchFn, minQueryLength]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch
  };
}

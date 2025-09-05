'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Performance monitoring hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
  });

  useEffect(() => {
    // Monitor page load time
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    }

    // Monitor memory usage (if available)
    const updateMemoryUsage = () => {
      if ('memory' in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
        }));
      }
    };

    // Monitor FPS
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setMetrics(prev => ({ ...prev, fps: frameCount }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
    updateMemoryUsage();
    
    const memoryInterval = setInterval(updateMemoryUsage, 5000);
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  return metrics;
}

// Image lazy loading hook with intersection observer
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isInView, src]);

  return { imageSrc, isLoaded, imgRef };
}

// Debounce hook for performance
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for performance
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useRef<T>();
  const lastRan = useRef<number>();

  useEffect(() => {
    throttledCallback.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => {
      if (lastRan.current === undefined) {
        throttledCallback.current?.(...args);
        lastRan.current = Date.now();
      } else {
        clearTimeout(lastRan.current);
        lastRan.current = setTimeout(() => {
          if (Date.now() - (lastRan.current as number) >= delay) {
            throttledCallback.current?.(...args);
            lastRan.current = Date.now();
          }
        }, delay - (Date.now() - lastRan.current));
      }
    }) as T,
    [delay]
  );
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling({
  itemHeight,
  containerHeight,
  items,
  overscan = 5
}: {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    ...item,
    index: startIndex + index
  }));

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
}

// Intersection observer hook for infinite scrolling
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean = true
) {
  const [isFetching, setIsFetching] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isFetching) {
          setIsFetching(true);
          callback();
        }
      },
      { threshold: 0.1 }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => observer.disconnect();
  }, [callback, hasMore, isFetching]);

  useEffect(() => {
    if (isFetching) {
      // Reset fetching state after callback completes
      const timer = setTimeout(() => setIsFetching(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isFetching]);

  return { targetRef, isFetching };
}

// Preload resources hook
export function usePreloadResources(resources: string[]) {
  const [loadedResources, setLoadedResources] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadResource = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          // Preload image
          const img = new Image();
          img.onload = () => {
            setLoadedResources(prev => new Set(prev).add(url));
            resolve();
          };
          img.onerror = reject;
          img.src = url;
        } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
          // Preload video
          const video = document.createElement('video');
          video.oncanplaythrough = () => {
            setLoadedResources(prev => new Set(prev).add(url));
            resolve();
          };
          video.onerror = reject;
          video.src = url;
          video.load();
        } else {
          // Generic resource preload
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          link.onload = () => {
            setLoadedResources(prev => new Set(prev).add(url));
            resolve();
          };
          link.onerror = reject;
          document.head.appendChild(link);
        }
      });
    };

    const preloadAll = async () => {
      try {
        await Promise.allSettled(resources.map(preloadResource));
      } catch (error) {
        console.warn('Some resources failed to preload:', error);
      }
    };

    if (resources.length > 0) {
      preloadAll();
    }
  }, [resources]);

  return {
    loadedResources,
    isResourceLoaded: (url: string) => loadedResources.has(url),
    loadProgress: loadedResources.size / resources.length
  };
}

// Web Workers hook for heavy computations
export function useWebWorker<T, R>(
  workerFunction: (data: T) => R,
  dependencies: any[] = []
) {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    // Create worker from function
    const workerCode = `
      self.onmessage = function(e) {
        const result = (${workerFunction.toString()})(e.data);
        self.postMessage(result);
      }
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    return () => {
      workerRef.current?.terminate();
    };
  }, dependencies);

  const runWorker = useCallback((data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const handleMessage = (e: MessageEvent) => {
        workerRef.current?.removeEventListener('message', handleMessage);
        resolve(e.data);
      };

      const handleError = (error: ErrorEvent) => {
        workerRef.current?.removeEventListener('error', handleError);
        reject(error);
      };

      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.addEventListener('error', handleError);
      workerRef.current.postMessage(data);
    });
  }, []);

  return runWorker;
}

// Cache hook for API responses
export function useCache<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getCachedData = useCallback(() => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }
    return null;
  }, [key, ttl]);

  const setCachedData = useCallback((data: T) => {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }, [key]);

  const fetchData = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCachedData();
      if (cached) {
        setData(cached);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setCachedData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetcher, getCachedData, setCachedData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    clearCache: () => localStorage.removeItem(`cache_${key}`)
  };
}

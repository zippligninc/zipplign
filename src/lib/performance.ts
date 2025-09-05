// Performance optimization utilities for Zipplign
import { useState, useEffect, useRef } from 'react';

export class PerformanceOptimizer {
  private static imageCache = new Map<string, string>();
  private static videoCache = new Map<string, string>();
  private static requestCache = new Map<string, { data: any; timestamp: number }>();
  
  // Cache duration in milliseconds (5 minutes)
  private static CACHE_DURATION = 5 * 60 * 1000;

  // Image optimization
  static async optimizeImage(src: string, width?: number, height?: number): Promise<string> {
    const cacheKey = `${src}_${width || 'auto'}_${height || 'auto'}`;
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    try {
      // For now, return the original src
      // In production, you might want to use a CDN or image optimization service
      const optimizedSrc = src;
      this.imageCache.set(cacheKey, optimizedSrc);
      return optimizedSrc;
    } catch (error) {
      console.error('Image optimization failed:', error);
      return src;
    }
  }

  // Video optimization
  static async optimizeVideo(src: string): Promise<string> {
    if (this.videoCache.has(src)) {
      return this.videoCache.get(src)!;
    }

    try {
      // For now, return the original src
      // In production, you might want to use video optimization services
      const optimizedSrc = src;
      this.videoCache.set(src, optimizedSrc);
      return optimizedSrc;
    } catch (error) {
      console.error('Video optimization failed:', error);
      return src;
    }
  }

  // Request caching
  static async cacheRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = this.CACHE_DURATION
  ): Promise<T> {
    const cached = this.requestCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    try {
      const data = await requestFn();
      this.requestCache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Clear expired cache entries
  static clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.requestCache.delete(key);
      }
    }
  }

  // Clear all caches
  static clearAllCaches(): void {
    this.imageCache.clear();
    this.videoCache.clear();
    this.requestCache.clear();
  }

  // Memory usage monitoring
  static getMemoryUsage(): { used: number; total: number; percentage: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return { used: 0, total: 0, percentage: 0 };
  }

  // Debounce function for performance
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function for performance
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Lazy loading hook
export function useLazyLoading() {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasLoaded]);

  return { ref, isIntersecting, hasLoaded };
}

// Virtual scrolling hook
export function useVirtualScrolling({
  itemHeight,
  containerHeight,
  itemCount,
  overscan = 5
}: {
  itemHeight: number;
  containerHeight: number;
  itemCount: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = Array.from(
    { length: endIndex - startIndex + 1 },
    (_, i) => startIndex + i
  );

  return {
    visibleItems,
    totalHeight: itemCount * itemHeight,
    offsetY: startIndex * itemHeight,
    setScrollTop
  };
}

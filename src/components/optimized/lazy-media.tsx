'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyMediaProps {
  src: string;
  alt: string;
  type: 'image' | 'video';
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyMedia({
  src,
  alt,
  type,
  className,
  width,
  height,
  priority = false,
  onLoad,
  onError
}: LazyMediaProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (mediaRef.current) {
      observer.observe(mediaRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        ref={mediaRef}
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Failed to load</span>
      </div>
    );
  }

  return (
    <div ref={mediaRef} className={cn('relative', className)}>
      {!isLoaded && (
        <Skeleton className="absolute inset-0 z-10" />
      )}
      
      {isInView && (
        <>
          {type === 'image' ? (
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className={cn(
                'transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0',
                className
              )}
              onLoad={handleLoad}
              onError={handleError}
              priority={priority}
            />
          ) : (
            <video
              src={src}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0',
                className
              )}
              muted
              playsInline
              onLoadedData={handleLoad}
              onError={handleError}
            />
          )}
        </>
      )}
    </div>
  );
}
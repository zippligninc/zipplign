'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function VideoFeedSkeleton() {
  return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        {/* Video skeleton */}
        <Skeleton className="w-full aspect-[9/16] bg-gray-800" />
        
        {/* Overlay skeleton */}
        <div className="absolute bottom-20 left-4 right-4 space-y-3">
          {/* User info skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24 bg-gray-700" />
              <Skeleton className="h-3 w-16 bg-gray-700" />
            </div>
          </div>
          
          {/* Description skeleton */}
          <Skeleton className="h-4 w-full bg-gray-700" />
          <Skeleton className="h-4 w-3/4 bg-gray-700" />
          
          {/* Music info skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 bg-gray-700" />
            <Skeleton className="h-4 w-32 bg-gray-700" />
          </div>
        </div>
        
        {/* Social actions skeleton */}
        <div className="absolute bottom-20 right-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-7 w-7 rounded-full bg-gray-700" />
              <Skeleton className="h-3 w-6 bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full bg-gray-700" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 bg-gray-700" />
          <Skeleton className="h-4 w-24 bg-gray-700" />
          <Skeleton className="h-4 w-40 bg-gray-700" />
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="flex gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-6 w-8 bg-gray-700 mx-auto mb-1" />
            <Skeleton className="h-4 w-12 bg-gray-700 mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Content grid skeleton */}
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[9/16] bg-gray-700" />
        ))}
      </div>
    </div>
  );
}

export function MusicBrowserSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <Skeleton className="h-10 w-full bg-gray-700" />
      
      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 bg-gray-700" />
        ))}
      </div>
      
      {/* Music cards skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full bg-gray-700" />
            <Skeleton className="h-4 w-full bg-gray-700" />
            <Skeleton className="h-3 w-3/4 bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

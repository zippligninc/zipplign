'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function Logo({ className, width = 40, height = 40, alt = "Zipplign Logo" }: LogoProps) {
  return (
    <Image
      src="/Images/logo.png"
      alt={alt}
      width={width}
      height={height}
      className={cn("object-contain", className)}
      priority
    />
  );
}

// Convenience components for different sizes
export function LogoSmall({ className }: { className?: string }) {
  return <Logo className={className} width={24} height={24} />;
}

export function LogoMedium({ className }: { className?: string }) {
  return <Logo className={className} width={40} height={40} />;
}

export function LogoLarge({ className }: { className?: string }) {
  return <Logo className={className} width={64} height={64} />;
}

export function LogoXLarge({ className }: { className?: string }) {
  return <Logo className={className} width={80} height={80} />;
}

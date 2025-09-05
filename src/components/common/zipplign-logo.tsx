
'use client';

import type { SVGProps } from 'react';
import { useState, useEffect } from 'react';

export function ZipplignLogo(props: SVGProps<SVGSVGElement>) {
  const [opacities, setOpacities] = useState<number[][]>([]);

  useEffect(() => {
    const newOpacities = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => Math.random() * 0.5 + 0.2)
    );
    setOpacities(newOpacities);
  }, []);


  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-label="Zipplign Logo"
      {...props}
    >
      <defs>
        <linearGradient id="zipplign-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="#2d3a3a" />
      <path
        d="M30 25 h40 l-20 25 h20 M30 50 h40 l-20 25 h20"
        stroke="url(#zipplign-gradient)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M70 25 v50"
        stroke="url(#zipplign-gradient)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
       <g fill="rgba(255,255,255,0.1)">
        {opacities.length > 0 && Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={22 + col * 7}
              y={22 + row * 7}
              width="4"
              height="4"
              rx="1"
              opacity={opacities[row][col]}
            />
          ))
        )}
      </g>
    </svg>
  );
}

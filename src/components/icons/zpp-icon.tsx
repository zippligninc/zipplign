import type { SVGProps } from 'react';

export function ZppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      {...props}
    >
      <defs>
        <linearGradient id="zpp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(158, 82%, 57%)' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(173, 58%, 39%)' }} />
        </linearGradient>
      </defs>
      <path 
        fill="url(#zpp-gradient)"
        d="M35,20 L65,20 L35,80 L65,80" 
        stroke="url(#zpp-gradient)"
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

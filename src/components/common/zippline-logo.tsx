import type { SVGProps } from 'react';

export function ZippLineLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      aria-label="ZippLine Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path
        fill="url(#logo-gradient)"
        d="M 19.01,23.33 H 181.82 L 19.01,178.67 H 181.82"
        stroke="url(#logo-gradient)"
        strokeWidth="12"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

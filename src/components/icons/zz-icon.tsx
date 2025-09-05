import type { SVGProps } from 'react';

export function ZZIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M10 4H15L10 12H15" stroke="#98D8FF" strokeWidth="2.5" />
      <path d="M6 12H11L6 20H11" stroke="#98D8FF" strokeWidth="2.5" />
    </svg>
  );
}

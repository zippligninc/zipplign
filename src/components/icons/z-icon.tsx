import type { SVGProps } from 'react';

export function ZIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M7 4H17L7 20H17" stroke="#FFD700" strokeWidth="3" />
    </svg>
  );
}

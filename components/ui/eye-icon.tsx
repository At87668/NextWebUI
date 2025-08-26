import * as React from 'react';

export const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.458 10.001C2.747 5.942 6.13 3.333 10 3.333c3.87 0 7.253 2.609 8.542 6.668a.833.833 0 010 .666C17.253 14.06 13.87 16.667 10 16.667c-3.87 0-7.253-2.608-8.542-6.667a.833.833 0 010-.666zM10 14.167a4.167 4.167 0 100-8.334 4.167 4.167 0 000 8.334zm0-1.667a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
      fill="currentColor"
    />
  </svg>
);

export const EyeOffIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M2.5 2.5l15 15M6.667 6.667A4.167 4.167 0 0010 14.167c.7 0 1.36-.18 1.93-.5m2.236-2.236A4.167 4.167 0 006.667 6.667m7.07 7.07C15.06 12.253 17.253 10 17.253 10c-1.289-4.059-4.672-6.668-8.542-6.668-1.13 0-2.22.19-3.24.54m-2.07 2.07C2.747 7.747.833 10 .833 10c1.289 4.059 4.672 6.667 8.542 6.667 1.13 0 2.22-.19 3.24-.54"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

import { cn } from '@/lib/utils';

type InlineNextLogoProps = {
  className?: string;
};

export function InlineNextLogo({ className }: InlineNextLogoProps) {
  return (
    <svg
      aria-label="Next logotype"
      role="img"
      viewBox="0 0 344 79"
      height="18"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-foreground', className)}
      style={{ colorScheme: 'light dark' }}
    >
      <path d="M261.919 0.0330722H330.547V12.7H303.323V79.339H289.71V12.7H261.919V0.0330722Z" fill="currentColor" />
      <path d="M149.052 0.0330722V12.7H94.0421V33.0772H138.281V45.7441H94.0421V66.6721H149.052V79.339H80.43V12.7H80.4243V0.0330722H149.052Z" fill="currentColor" />
      <path d="M183.32 0.0661486H165.506L229.312 79.3721H247.178L215.271 39.7464L247.127 0.126654L229.312 0.154184L206.352 28.6697L183.32 0.0661486Z" fill="currentColor" />
      <path d="M201.6 56.7148L192.679 45.6229L165.455 79.4326H183.32L201.6 56.7148Z" fill="currentColor" />
      <path
        clipRule="evenodd"
        d="M80.907 79.339L17.0151 0H0V79.3059H13.6121V16.9516L63.8067 79.339H80.907Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
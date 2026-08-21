import { cn } from "@/lib/utils";

/**
 * Signature CODPO — coretan harga gaya spidol tangan (DS §5).
 * Hanya untuk harga lama listing BU. Jangan dipakai di elemen lain.
 */
export function PriceStrike({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-block whitespace-nowrap", className)}>
      {children}
      <svg
        aria-hidden
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -inset-x-1 -inset-y-0.5 h-[calc(100%+0.25rem)] w-[calc(100%+0.5rem)] -rotate-1 text-current"
      >
        <path
          d="M2 9 Q 50 5.5 98 9.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M3 15 Q 55 17.5 97 13.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

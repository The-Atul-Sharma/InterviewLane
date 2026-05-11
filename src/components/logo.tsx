import { cn } from "@/lib/utils";

/**
 * Geometric monogram — borrowed from the design canvas.
 * Stroke gradient (brand → teal) with a single dot accent.
 */
export function Logo({
  size = 22,
  withWord = true,
  className,
}: {
  size?: number;
  withWord?: boolean;
  className?: string;
}) {
  const gid = `logoGrad-${size}`;
  return (
    <span
      className={cn("inline-flex items-center gap-2 leading-none", className)}
      aria-label="FrontendAce"
    >
      <svg width={size} height={size} viewBox="0 0 28 28" className="block">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--brand))" />
            <stop offset="100%" stopColor="hsl(var(--teal))" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="26"
          height="26"
          rx="7"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
        <path
          d="M9 9 L9 19 M14 9 L14 19 M19 9 L19 14 M14 14 L19 14"
          stroke={`url(#${gid})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="22" cy="6" r="1.6" fill="hsl(var(--brand))" />
      </svg>
      {withWord && (
        <span
          className="font-semibold tracking-tight"
          style={{ fontSize: size * 0.72 }}
        >
          Frontend
          <span className="font-medium text-muted-foreground">Ace</span>
        </span>
      )}
    </span>
  );
}

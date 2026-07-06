import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
};

/**
 * Beatify logo — a circular ring wrapping a lowercase "b" styled as a music
 * note (stem + angled flag + bowl with a cut-out eye). Rendered in the
 * app's primary red→ember gradient.
 */
export function BeatifyLogo({ size = 40, className, withWordmark, wordmarkClassName }: Props) {
  const gradId = "beatify-logo-gradient";
  const maskId = "beatify-logo-mask";
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Beatify"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.635 0.22 26)" />
            <stop offset="100%" stopColor="oklch(0.72 0.20 30)" />
          </linearGradient>
          <mask id={maskId}>
            {/* everything white = visible, black = hole */}
            <rect width="64" height="64" fill="black" />
            {/* outer ring */}
            <circle cx="32" cy="32" r="28" fill="white" />
            <circle cx="32" cy="32" r="23" fill="black" />
            {/* stem of the "b" */}
            <rect x="23" y="12" width="6" height="30" rx="2" fill="white" />
            {/* angled flag on top of stem, like a music-note flag */}
            <path d="M29 12 L46 8 L46 20 L29 24 Z" fill="white" />
            {/* bowl of the "b" */}
            <circle cx="34" cy="42" r="12" fill="white" />
            {/* cut-out eye inside the bowl */}
            <circle cx="34" cy="42" r="4" fill="black" />
          </mask>
        </defs>
        <rect width="64" height="64" fill={`url(#${gradId})`} mask={`url(#${maskId})`} />
      </svg>
      {withWordmark && (
        <span
          className={cn(
            "text-gradient-primary text-lg font-black tracking-tight lowercase",
            wordmarkClassName,
          )}
        >
          beatify
        </span>
      )}
    </div>
  );
}

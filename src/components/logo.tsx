import { cn } from "@/lib/utils";
import logoFull from "@/assets/beatify-logo.png";
import logoMark from "@/assets/beatify-mark.png";

type Props = {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  wordmarkClassName?: string;
};

/**
 * Beatify logo — official brand mark. Uses the full lockup (mark + wordmark)
 * when `withWordmark` is true, otherwise the standalone mark.
 */
export function BeatifyLogo({ size = 40, className, withWordmark, wordmarkClassName: _w }: Props) {
  void _w;
  const src = withWordmark ? logoFull : logoMark;
  // full lockup aspect ~ 380x524; mark ~ 380x410. Scale by height=size.
  const aspect = withWordmark ? 380 / 524 : 380 / 410;
  const height = withWordmark ? Math.round(size * 1.35) : size;
  const width = Math.round(height * aspect);
  return (
    <div className={cn("inline-flex items-center", className)}>
      <img
        src={src}
        alt="Beatify"
        width={width}
        height={height}
        style={{ width, height }}
        className="shrink-0 select-none"
        draggable={false}
      />
    </div>
  );
}

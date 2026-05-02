// Character art for screens that benefit from a focal mascot.
// v0 uses native emoji as the source — they render as Apple emoji on
// iOS/Safari and Twemoji elsewhere, both of which read as 3D-ish.
// Phase 9+: swap each name for a real PNG/Lottie file in /public/images/characters/.
import { cn } from "@/lib/utils";

type Variant =
  | "baby"
  | "moon"
  | "bottle"
  | "bear"
  | "shield"
  | "rocket"
  | "stars"
  | "sparkle"
  | "heart"
  | "rainbow"
  | "thinking"
  | "celebrate";

type BgTone =
  | "peach"
  | "sage"
  | "rose"
  | "amber"
  | "soft-blue"
  | "lavender"
  | "mint"
  | "cream";

const EMOJI: Record<Variant, string> = {
  baby: "👶",
  moon: "🌙",
  bottle: "🍼",
  bear: "🧸",
  shield: "🛡️",
  rocket: "🚀",
  stars: "✨",
  sparkle: "💫",
  heart: "💖",
  rainbow: "🌈",
  thinking: "🤔",
  celebrate: "🎉",
};

const BG: Record<BgTone, string> = {
  peach: "bg-peach-soft",
  sage: "bg-sage-soft",
  rose: "bg-rose-soft",
  amber: "bg-amber-soft",
  "soft-blue": "bg-soft-blue-soft",
  lavender: "bg-lavender",
  mint: "bg-mint",
  cream: "bg-cream",
};

type Props = {
  variant: Variant;
  bg?: BgTone;
  size?: "sm" | "md" | "lg" | "xl";
  float?: boolean;
  className?: string;
};

const SIZE_PX = { sm: 96, md: 144, lg: 200, xl: 280 } as const;
const EMOJI_PX = { sm: 56, md: 84, lg: 120, xl: 168 } as const;

export function Character({
  variant,
  bg = "peach",
  size = "md",
  float = true,
  className,
}: Props) {
  return (
    <div
      role="img"
      aria-label={variant}
      className={cn(
        "rounded-2xl grid place-items-center select-none shadow-[var(--shadow-soft)]",
        BG[bg],
        float && "motion-safe:animate-[float_6s_ease-in-out_infinite]",
        className
      )}
      style={{
        width: SIZE_PX[size],
        height: SIZE_PX[size],
      }}
    >
      <span style={{ fontSize: EMOJI_PX[size], lineHeight: 1 }} aria-hidden>
        {EMOJI[variant]}
      </span>
    </div>
  );
}

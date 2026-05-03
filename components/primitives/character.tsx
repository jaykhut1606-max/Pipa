// Character art for screens that benefit from a focal mascot.
//
// Was: native emojis (👶 🌙 🍼 etc.) — looked OS-themed and inconsistent.
// Now: lucide-react icons rendered into the same tinted tile so screens
// like onboarding, success, and error stay on-brand and match the rest
// of the iconography across the app.
import {
  Baby,
  Heart,
  Lightbulb,
  Moon,
  PartyPopper,
  Rocket,
  Shield,
  Sparkle,
  Sparkles,
  Star,
  Sun,
  type LucideIcon,
} from "lucide-react";
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

// Each variant maps to a lucide icon + a per-variant accent color so the
// tile feels intentional (not "everything is plum"). Bg tone is still
// caller-controlled.
const ICON: Record<Variant, { Icon: LucideIcon; tint: string }> = {
  baby: { Icon: Baby, tint: "text-clay" },
  moon: { Icon: Moon, tint: "text-plum" },
  bottle: { Icon: Sparkle, tint: "text-vivid-blue" }, // bottle had no exact lucide; sparkle reads as "fresh"
  bear: { Icon: Heart, tint: "text-rose" },
  shield: { Icon: Shield, tint: "text-sage" },
  rocket: { Icon: Rocket, tint: "text-vivid-blue" },
  stars: { Icon: Sparkles, tint: "text-amber" },
  sparkle: { Icon: Sparkle, tint: "text-amber" },
  heart: { Icon: Heart, tint: "text-rose" },
  rainbow: { Icon: Sun, tint: "text-vivid-peach" },
  thinking: { Icon: Lightbulb, tint: "text-amber" },
  celebrate: { Icon: PartyPopper, tint: "text-vivid-peach" },
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

const TILE_PX = { sm: 96, md: 144, lg: 200, xl: 280 } as const;
const ICON_PX = { sm: 48, md: 72, lg: 100, xl: 144 } as const;

const ARIA_LABEL: Record<Variant, string> = {
  baby: "Baby",
  moon: "Sleep",
  bottle: "Feed",
  bear: "Comfort",
  shield: "Safe",
  rocket: "Boost",
  stars: "Magical",
  sparkle: "Highlight",
  heart: "Care",
  rainbow: "Fresh",
  thinking: "Thinking",
  celebrate: "Celebrate",
};

export function Character({
  variant,
  bg = "peach",
  size = "md",
  float = true,
  className,
}: Props) {
  const { Icon, tint } = ICON[variant];
  const px = ICON_PX[size];
  return (
    <div
      role="img"
      aria-label={ARIA_LABEL[variant]}
      className={cn(
        "rounded-2xl grid place-items-center select-none shadow-[var(--shadow-soft)]",
        BG[bg],
        float && "motion-safe:animate-[float_6s_ease-in-out_infinite]",
        className,
      )}
      style={{
        width: TILE_PX[size],
        height: TILE_PX[size],
      }}
    >
      <Icon
        width={px}
        height={px}
        strokeWidth={1.6}
        className={cn("shrink-0", tint)}
        aria-hidden
      />
    </div>
  );
}

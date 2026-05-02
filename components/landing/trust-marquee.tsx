"use client";

// Trust strip — small pill chips for credibility. Mobile uses a slow GSAP
// infinite x-translation marquee (looping a doubled list); sm+ shows a
// static centered row. We bake the chip palette into the data so the call
// site stays terse.
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ShieldCheck, Sparkles, Stethoscope, Lock, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipTone = "sage" | "soft-blue" | "amber" | "peach" | "rose";

const CHIPS: Array<{ icon: React.ReactNode; label: string; tone: ChipTone }> = [
  { icon: <Stethoscope className="size-3.5" />, label: "AAP-aligned guidance", tone: "sage" },
  { icon: <BadgeCheck className="size-3.5" />, label: "CDC age norms", tone: "soft-blue" },
  { icon: <Lock className="size-3.5" />, label: "Photos never stored", tone: "amber" },
  { icon: <Sparkles className="size-3.5" />, label: "Trained with NICU nurses", tone: "peach" },
  { icon: <ShieldCheck className="size-3.5" />, label: "On-device first", tone: "rose" },
];

const TONES: Record<ChipTone, string> = {
  sage: "bg-sage-soft text-sage",
  "soft-blue": "bg-soft-blue-soft text-vivid-blue",
  amber: "bg-amber-soft text-clay",
  peach: "bg-peach-soft text-clay",
  rose: "bg-rose-soft text-rose",
};

function Chip({ icon, label, tone }: (typeof CHIPS)[number]) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill px-4 py-2 text-small font-medium shadow-[var(--shadow-soft)] shrink-0",
        TONES[tone],
      )}
    >
      <span aria-hidden>{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
}

export function TrustMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Only run the marquee on small screens (< 640px) where we duplicate.
      const isSmall = window.matchMedia("(max-width: 639px)").matches;
      if (reduce || !isSmall || !trackRef.current) return;

      const track = trackRef.current;
      // Track contains 2 copies. Animate from 0 → -50% (one copy width).
      const ctx = gsap.context(() => {
        gsap.to(track, {
          xPercent: -50,
          ease: "none",
          duration: 22,
          repeat: -1,
        });
      });
      return () => ctx.revert();
    },
    { dependencies: [] },
  );

  return (
    <section
      aria-label="Trust signals"
      className="border-y border-bone/60 bg-cream/60"
    >
      {/* Mobile marquee */}
      <div className="sm:hidden overflow-hidden py-5">
        <div ref={trackRef} className="flex gap-3 w-max will-change-transform">
          {[...CHIPS, ...CHIPS].map((chip, i) => (
            <Chip key={`m-${i}`} {...chip} />
          ))}
        </div>
      </div>
      {/* Static row on sm+ */}
      <div className="hidden sm:flex container-marketing flex-wrap items-center justify-center gap-3 py-6">
        {CHIPS.map((chip) => (
          <Chip key={chip.label} {...chip} />
        ))}
      </div>
    </section>
  );
}

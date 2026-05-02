"use client";

// Hero — peach gradient backdrop, GSAP-staged headline → body → CTAs → art.
// Two columns on sm+, single stack on mobile. SpeechBubble is anchored on the
// character's top edge so the tail visually points AT the mascot, not into
// empty space.
import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { DarkCTA } from "@/components/primitives/dark-cta";
import { Character } from "@/components/primitives/character";
import { SpeechBubble } from "@/components/primitives/speech-bubble";

export function HeroStage() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Reduced-motion users: snap straight to the final state.
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(
          [
            ".hero-eyebrow",
            ".hero-title",
            ".hero-body",
            ".hero-cta",
            ".hero-art",
            ".hero-bubble",
          ],
          { clearProps: "all", opacity: 1, y: 0, scale: 1 },
        );
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { y: 16, opacity: 0, duration: 0.45 })
        .from(".hero-title", { y: 28, opacity: 0, duration: 0.7 }, "-=0.25")
        .from(".hero-body", { y: 16, opacity: 0, duration: 0.5 }, "-=0.4")
        .from(
          ".hero-cta",
          { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 },
          "-=0.3",
        )
        .from(
          ".hero-art",
          { scale: 0.9, opacity: 0, duration: 0.7, ease: "back.out(1.4)" },
          "-=0.55",
        )
        .from(
          ".hero-bubble",
          { y: -10, opacity: 0, duration: 0.45, ease: "back.out(1.6)" },
          "-=0.25",
        );
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="container-marketing flex flex-col-reverse md:grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-12 items-center pt-10 pb-20 md:pt-14 md:pb-24"
    >
      <div className="flex flex-col items-center md:items-start text-center md:text-left gap-6">
        <span className="hero-eyebrow inline-flex items-center gap-2 rounded-pill bg-peach-soft text-peach-foreground text-micro uppercase tracking-wider text-clay px-3 py-1.5 font-medium">
          <span aria-hidden className="size-1.5 rounded-full bg-clay/80" />
          Built with pediatricians
        </span>

        <h1 className="hero-title font-display text-hero text-ink leading-[1.05] tracking-tight max-w-[10ch]">
          Understand your baby.
        </h1>

        <p className="hero-body text-body text-stone max-w-md">
          AI scans for cries, diapers, and rashes — plus a daily tracker that
          turns logs into insight. Warm, careful guidance for the whole first
          year.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md">
          <div className="hero-cta">
            <PrimaryCTA href="/welcome" showArrow className="whitespace-nowrap">
              Try Pippa
            </PrimaryCTA>
          </div>
          <div className="hero-cta">
            <DarkCTA href="/signin" className="whitespace-nowrap text-cream">
              I have an account
            </DarkCTA>
          </div>
        </div>

        <div className="hero-cta flex flex-wrap items-center gap-x-3 gap-y-1 text-micro uppercase tracking-wider text-stone pt-1">
          <span>No signup needed</span>
          <span aria-hidden>·</span>
          <span>Demo mode</span>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="hover:text-ink underline decoration-transparent hover:decoration-stone underline-offset-4">
            Privacy first
          </Link>
        </div>
      </div>

      {/* Right column: floating mascot with anchored speech bubble */}
      <div className="hero-art relative flex justify-center md:justify-end">
        {/* Soft ambient halo behind the character */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 grid place-items-center"
        >
          <div className="size-[320px] md:size-[360px] rounded-full bg-vivid-peach-soft blur-3xl opacity-70" />
        </div>
        <div className="relative">
          <Character variant="baby" bg="peach" size="xl" float />
          {/* Speech bubble — tail points down at the character's top */}
          <div className="hero-bubble absolute -top-6 right-2 md:-right-4">
            <SpeechBubble pointer="down">Trust your instinct.</SpeechBubble>
          </div>
          {/* Tiny orbiting accent dots for visual richness without baby-ish */}
          <span
            aria-hidden
            className="absolute -bottom-2 -left-2 size-3 rounded-full bg-sage shadow-[var(--shadow-soft)]"
          />
          <span
            aria-hidden
            className="absolute top-8 -right-3 size-2 rounded-full bg-vivid-blue/80 shadow-[var(--shadow-soft)]"
          />
        </div>
      </div>
    </section>
  );
}

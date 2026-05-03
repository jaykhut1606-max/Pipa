// First post-signup screen. Sets the warm-not-clinical tone:
// peach gradient hero, floating baby character, Pippa's first hello,
// and a single CTA into the four-step onboarding.
//
// Lifted entrance: GSAP timeline scales the Logo from 0→1 with a tiny back
// ease, fades in the speech bubble, then springs each headline word in 80ms
// apart. Reduced motion → instant final state.
"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { SpeechBubble } from "@/components/primitives/speech-bubble";
import { GradientHero } from "@/components/primitives/gradient-hero";
import {
  PROFILE_KEY,
  writeProfile,
  type BabyProfile,
} from "@/components/onboarding/profile-store";

const HEADLINE = "Let's get to know your baby.";

export default function WelcomePage() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Split the headline into words once. We render each word in its own span
  // so GSAP can stagger them. We keep an explicit space after every word to
  // preserve copy-paste fidelity.
  const words = useMemo(() => HEADLINE.split(" "), []);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        gsap.set(
          [".w-character", ".w-bubble", ".w-word", ".w-sub", ".w-cta", ".w-disclaimer"],
          { clearProps: "all", opacity: 1, y: 0, scale: 1 },
        );
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".w-character", {
        scale: 0,
        opacity: 0,
        duration: 0.7,
        ease: "back.out(1.6)",
      })
        .from(
          ".w-bubble",
          { y: -10, opacity: 0, duration: 0.4, ease: "back.out(1.6)" },
          "-=0.25",
        )
        .from(
          ".w-word",
          {
            y: 16,
            opacity: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "back.out(1.4)",
          },
          "-=0.25",
        )
        .from(".w-sub", { y: 10, opacity: 0, duration: 0.4 }, "-=0.2")
        .from(".w-cta", { y: 12, opacity: 0, duration: 0.45 }, "-=0.2")
        .from(".w-disclaimer", { opacity: 0, duration: 0.4 }, "-=0.2");
    },
    { scope: root },
  );

  // Skip flow mirrors onboarding/layout.tsx — write a sensible default so
  // /scan and the rest of the app have something to read in demo mode.
  const handleSkip = () => {
    if (typeof window !== "undefined") {
      try {
        const existing = window.localStorage.getItem(PROFILE_KEY);
        if (!existing) {
          const birth = new Date();
          birth.setMonth(birth.getMonth() - 3);
          const fallback: BabyProfile = {
            name: "Baby",
            birthDate: birth.toISOString().slice(0, 10),
            feedingType: ["mixed"],
            concerns: [],
            onboardedAt: new Date().toISOString(),
          };
          writeProfile(fallback);
        }
      } catch {
        /* ignore */
      }
    }
    router.push("/home");
  };

  return (
    <GradientHero
      tone="peach"
      className="flex-1 flex flex-col items-center text-center"
    >
      <main
        ref={root}
        className="container-app flex-1 flex flex-col items-center justify-center gap-8 py-12"
      >
        <div className="relative">
          <div className="w-character relative size-56 sm:size-64 motion-safe:animate-[float_6s_ease-in-out_infinite]">
            <Image
              src="/images/pippa-mascot.png"
              alt="Pippa, a soft peach-colored mascot holding a heart"
              fill
              priority
              sizes="(min-width: 640px) 256px, 224px"
              className="object-contain [filter:var(--drop-shadow-mascot)]"
            />
          </div>
          <div className="w-bubble absolute -top-3 -right-2 sm:-right-6">
            <SpeechBubble pointer="down">Hi, I&rsquo;m Pippa.</SpeechBubble>
          </div>
        </div>

        <div className="flex flex-col gap-4 max-w-sm">
          <h1
            className="font-display text-hero text-ink leading-[1.05]"
            aria-label={HEADLINE}
          >
            {words.map((word, i) => (
              <span key={i} className="inline-block">
                <span className="w-word inline-block">{word}</span>
                {i < words.length - 1 && <span aria-hidden>&nbsp;</span>}
              </span>
            ))}
          </h1>
          <p className="w-sub text-body text-stone">
            A few quick questions so I can help you better. About 30 seconds.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs items-center">
          <div className="w-cta w-full">
            <PrimaryCTA href="/onboarding/age" showArrow fullWidth>
              Continue
            </PrimaryCTA>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="w-cta text-small text-stone hover:text-ink h-11 px-2 -mb-2"
          >
            Skip for now
          </button>
          <p className="w-disclaimer text-micro uppercase tracking-wider text-stone pt-2 max-w-[28ch]">
            Educational support, not medical diagnosis or treatment.
          </p>
          <p className="w-disclaimer text-micro text-stone">
            <Link href="/" className="hover:text-ink underline-offset-4 hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </GradientHero>
  );
}

// Marketing landing — Phase 9 fills out the full marketing story.
// For now: a hero that previews the Nanni-style polish (gradient bg,
// floating character, speech bubble, primary CTA).
import { Logo } from "@/components/brand/logo";
import { Wordmark } from "@/components/brand/wordmark";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { Character } from "@/components/primitives/character";
import { SpeechBubble } from "@/components/primitives/speech-bubble";
import { GradientHero } from "@/components/primitives/gradient-hero";

export default function HomePage() {
  return (
    <GradientHero
      tone="peach"
      className="flex-1 flex flex-col items-center text-center"
    >
      <header className="container-marketing flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <Wordmark className="text-h3" />
        </div>
        <a
          href="/signin"
          className="text-small text-stone hover:text-ink h-11 inline-flex items-center"
        >
          Sign in
        </a>
      </header>

      <main className="container-marketing flex flex-col items-center gap-8 pt-6 pb-16">
        <div className="relative">
          <Character variant="baby" bg="peach" size="xl" />
          <div className="absolute -top-3 -right-2 sm:-right-6 motion-safe:animate-[fadeUp_0.6s_ease-out]">
            <SpeechBubble pointer="down">Trust your instinct.</SpeechBubble>
          </div>
        </div>

        <h1 className="font-display text-hero text-ink max-w-md motion-safe:animate-[fadeUp_0.6s_ease-out]">
          Understand your baby.
        </h1>
        <p className="text-body text-stone max-w-sm">
          AI scans for cries, diapers, and rashes. Built with pediatricians.
          Educational support, not medical advice.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <PrimaryCTA href="/welcome" showArrow fullWidth>
            Try Pippa
          </PrimaryCTA>
          <p className="text-micro uppercase tracking-wider text-stone">
            no signup needed · demo mode
          </p>
        </div>
      </main>
    </GradientHero>
  );
}

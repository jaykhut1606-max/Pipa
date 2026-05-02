// Marketing landing — full implementation in Phase 9.
// For now, a minimal hero so the dev server has something useful to render.
import { Logo } from "@/components/brand/logo";
import { PrimaryCTA } from "@/components/primitives/primary-cta";

export default function HomePage() {
  return (
    <main className="container-marketing flex flex-1 flex-col items-center justify-center text-center gap-10 py-24">
      <div className="flex flex-col items-center gap-6">
        <Logo size={72} />
        <h1 className="font-display text-hero text-ink max-w-md">
          Understand your baby.
        </h1>
        <p className="text-body text-stone max-w-sm">
          AI scans for cries, diapers, and rashes. Built with pediatricians.
          Educational support, not medical advice.
        </p>
      </div>
      <PrimaryCTA href="/signin" showArrow>
        Get started
      </PrimaryCTA>
      <p className="text-micro uppercase tracking-wider text-stone">
        v0 · scaffold
      </p>
    </main>
  );
}

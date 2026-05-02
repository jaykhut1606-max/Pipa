// Marketing landing — full implementation in Phase 9.
// For now, a minimal hero so the dev server has something useful to render.
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container-marketing flex flex-1 flex-col items-center justify-center text-center gap-10 py-24">
      <div className="flex flex-col items-center gap-6">
        <div className="size-16 rounded-pill bg-peach grid place-items-center">
          <span className="size-7 rounded-pill bg-cream" />
        </div>
        <h1 className="font-display text-hero text-ink max-w-md">
          Understand your baby.
        </h1>
        <p className="text-body text-stone max-w-sm">
          AI scans for cries, diapers, and rashes. Built with pediatricians.
          Educational support, not medical advice.
        </p>
      </div>
      <Link
        href="/signin"
        className="inline-flex items-center justify-center h-14 px-8 rounded-pill bg-peach text-ink font-medium hover:bg-peach/90 transition-colors"
      >
        Get started
      </Link>
      <p className="text-micro uppercase tracking-wider text-stone">
        v0 · scaffold
      </p>
    </main>
  );
}

// Marketing footer. Three columns on sm+, stacked on mobile.
// Includes the educational-not-medical disclaimer and minimal navigation.
import Link from "next/link";
import Image from "next/image";
import { Wordmark } from "@/components/brand/wordmark";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-cream border-t border-bone/70">
      <div className="container-marketing py-10 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex flex-col gap-3 max-w-xs">
          <Link
            href="/"
            aria-label="Pippa home"
            className="flex items-center gap-2.5"
          >
            <span
              aria-hidden
              className="relative grid place-items-center size-9 overflow-hidden shadow-[0_4px_10px_-2px_rgba(245,169,131,0.45),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_4px_rgba(74,53,64,0.10)]"
              style={{
                borderRadius: "28%",
                backgroundImage:
                  "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 32%), linear-gradient(135deg, var(--color-peach-soft) 0%, var(--color-vivid-peach-soft) 100%)",
              }}
            >
              <Image
                src="/images/pippa-mark.png"
                alt="Pippa"
                width={36}
                height={36}
                className="size-full object-cover mix-blend-multiply"
              />
            </span>
            <Wordmark className="text-h3" />
          </Link>
          <p className="text-small text-stone leading-relaxed">
            Pippa is educational support, not medical diagnosis or treatment.
            For urgent concerns, call your pediatrician or emergency services.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-6 gap-y-2 text-small text-stone"
        >
          <Link href="/privacy" className="hover:text-ink h-11 inline-flex items-center">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink h-11 inline-flex items-center">
            Terms
          </Link>
          <Link href="/signin" className="hover:text-ink h-11 inline-flex items-center">
            Sign in
          </Link>
          <Link href="/welcome" className="hover:text-ink h-11 inline-flex items-center">
            Try Pippa
          </Link>
        </nav>
      </div>
      <div className="container-marketing border-t border-bone/60 py-5 text-micro uppercase tracking-wider text-stone">
        © {year} Pippa. Made with care.
      </div>
    </footer>
  );
}

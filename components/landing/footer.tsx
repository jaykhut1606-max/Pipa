// Marketing footer. Three columns on sm+, stacked on mobile.
// Includes the educational-not-medical disclaimer and minimal navigation.
import Link from "next/link";
import Image from "next/image";

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-cream border-t border-bone/70">
      <div className="container-marketing py-10 flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex flex-col gap-3 max-w-xs">
          <Link href="/" aria-label="Pippa home" className="flex items-center">
            <Image
              src="/images/pippa-logo.png"
              alt="Pippa"
              width={48}
              height={48}
              className="size-12 object-contain mix-blend-multiply"
            />
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

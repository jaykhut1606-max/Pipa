import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
};

// Grid-based layout (3 equal columns) so the title is always
// dead-centered regardless of how wide the back link or right action
// are. The previous flex layout drifted off-axis when those two sides
// had different content widths.
export function NavBar({ title, showBack, backHref = "/", rightAction }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-bone">
      <div className="container-app h-14 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="justify-self-start min-w-0">
          {showBack && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-small text-stone hover:text-ink h-10 px-2 -ml-2 rounded-pill hover:bg-bone/40 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span>Back</span>
            </Link>
          )}
        </div>
        {title && (
          <h1 className="font-display text-h3 text-ink truncate text-center">
            {title}
          </h1>
        )}
        <div className="justify-self-end min-w-0">{rightAction}</div>
      </div>
    </header>
  );
}

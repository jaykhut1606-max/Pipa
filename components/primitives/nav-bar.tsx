import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
};

export function NavBar({ title, showBack, backHref = "/", rightAction }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-sm border-b border-bone">
      <div className="container-app h-14 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {showBack && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-small text-stone hover:text-ink h-11"
              aria-label="Back"
            >
              <ArrowLeft className="size-4" aria-hidden />
              <span>Back</span>
            </Link>
          )}
        </div>
        {title && (
          <h1 className="font-display text-h3 text-ink truncate">{title}</h1>
        )}
        <div className="flex-1 flex justify-end min-w-0">{rightAction}</div>
      </div>
    </header>
  );
}

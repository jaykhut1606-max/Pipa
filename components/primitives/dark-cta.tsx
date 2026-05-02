"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  showArrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  className?: string;
};

const baseStyles =
  "h-14 px-8 rounded-pill bg-ink text-cream font-medium text-body inline-flex items-center justify-center gap-2 transition-colors hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ink/30 disabled:opacity-50 disabled:cursor-not-allowed";

export function DarkCTA({
  children,
  onClick,
  href,
  showArrow,
  loading,
  disabled,
  fullWidth,
  type = "button",
  className,
}: Props) {
  const classes = cn(baseStyles, fullWidth && "w-full", className);
  const content = (
    <>
      <span>{loading ? "Just a moment…" : children}</span>
      {showArrow && !loading && <ArrowRight className="size-4" aria-hidden />}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}

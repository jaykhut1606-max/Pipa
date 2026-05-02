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
  ariaLabel?: string;
};

const baseStyles =
  "h-14 px-8 rounded-pill bg-peach text-ink font-medium text-body inline-flex items-center justify-center gap-2 transition-colors hover:bg-peach/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40 disabled:opacity-50 disabled:cursor-not-allowed";

export function PrimaryCTA({
  children,
  onClick,
  href,
  showArrow,
  loading,
  disabled,
  fullWidth,
  type = "button",
  className,
  ariaLabel,
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
      <Link href={href} className={classes} aria-label={ariaLabel}>
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
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}

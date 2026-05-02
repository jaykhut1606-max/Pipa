"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChart, Camera, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: typeof LineChart;
  primary?: boolean;
};

// Four-tab nav: Trackers · Scan (centered, peach) · Chat · Profile.
// Trackers absorbs both the daily log and the scan history timeline, so the
// old standalone /history route is reachable from the Trackers · Details tab.
const TABS: Tab[] = [
  { href: "/trackers", label: "Trackers", icon: LineChart },
  { href: "/scan", label: "Scan", icon: Camera, primary: true },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/settings", label: "Profile", icon: User },
];

// Routes that suppress the bar entirely — capture / analyzing / result reveal
// want full immersion.
const HIDE_ON = [
  "/scan/diaper",
  "/scan/cry",
  "/scan/rash",
  "/result",
  "/onboarding",
  "/welcome",
  "/paywall",
  "/signin",
  "/verify",
  "/dev",
];

export function TabBar() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      className="sticky bottom-0 z-40 bg-cream/95 backdrop-blur-md border-t border-bone"
      aria-label="Primary"
    >
      <div className="container-app h-[72px] grid grid-cols-4 items-center">
        {TABS.map(({ href, label, icon: Icon, primary }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                className="flex justify-center items-center"
              >
                <span className="size-14 rounded-pill bg-peach text-ink grid place-items-center -mt-7 shadow-[var(--shadow-pop)] ring-4 ring-cream">
                  <Icon className="size-6" strokeWidth={2.2} aria-hidden />
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative h-full flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-peach" : "text-stone hover:text-ink"
              )}
            >
              <Icon className="size-5" strokeWidth={2.2} aria-hidden />
              <span className="text-micro uppercase tracking-wider">
                {label}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute bottom-1.5 size-1 rounded-pill bg-peach"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

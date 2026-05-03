"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
};

// Four-tab nav. Matches the reference IA: Home is the dashboard, Trackers
// rolls up Track / Summary / Details, Milestones is the per-bucket
// development tracker, Chat is the pediatric AI thread. Profile is reached
// via the Home header pill rather than a tab — same as the reference.
const TABS: Tab[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/trackers", label: "Trackers", icon: ClipboardList },
  { href: "/milestones", label: "Milestones", icon: Sparkles },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

// Routes that suppress the bar entirely — themed entry screens, capture
// flows, results, paywall, and onboarding all want full immersion.
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
  "/trackers/sleep/log",
  "/trackers/diaper/log",
  "/trackers/feed/log",
  "/profile",
];

export function TabBar() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      className="sticky bottom-0 z-40 bg-cream/95 backdrop-blur-md border-t border-bone print:hidden"
      aria-label="Primary"
    >
      <div className="container-app h-16 grid grid-cols-4 px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-1 transition-colors",
                isActive ? "text-plum" : "text-stone hover:text-ink"
              )}
            >
              <Icon className="size-5 shrink-0" strokeWidth={2.2} aria-hidden />
              <span className="text-[10px] leading-none uppercase tracking-wider truncate max-w-full">
                {label}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute bottom-1 h-0.5 w-6 rounded-pill bg-plum"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

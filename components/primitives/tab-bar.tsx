"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: typeof Clock;
  primary?: boolean;
};

const TABS: Tab[] = [
  { href: "/history", label: "History", icon: Clock },
  { href: "/scan", label: "Scan", icon: Camera, primary: true },
  { href: "/settings", label: "Profile", icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-40 bg-cream/95 backdrop-blur-sm border-t border-bone"
      aria-label="Primary"
    >
      <div className="container-app h-18 grid grid-cols-3 items-center">
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
                <span className="size-14 rounded-pill bg-peach text-ink grid place-items-center -mt-7 shadow-md ring-4 ring-cream">
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
                "relative h-full flex flex-col items-center justify-center gap-1",
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

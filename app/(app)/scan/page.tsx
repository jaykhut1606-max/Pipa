// Scan center — home of the app. Four large character cards route into
// each scan flow plus open chat. Greeting reads from the demo localStorage
// baby profile; falls back to a neutral hello.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import {
  TrackerIcon,
} from "@/components/icons/tracker-icon";
import { readProfile } from "@/components/onboarding/profile-store";

type CardSpec = {
  href: string;
  title: string;
  subtitle: string;
  iconVariant: React.ComponentProps<typeof TrackerIcon>["variant"];
};

const CARDS: CardSpec[] = [
  {
    href: "/scan/diaper",
    title: "Diaper",
    subtitle: "Show me a photo. I'll read the color and texture.",
    iconVariant: "diaper",
  },
  {
    href: "/scan/cry",
    title: "Cry",
    subtitle: "Listen for a few seconds. I'll guess the why.",
    iconVariant: "cry",
  },
  {
    href: "/scan/rash",
    title: "Rash",
    subtitle: "A photo and a couple of details to triage.",
    iconVariant: "rash",
  },
  {
    href: "/chat",
    title: "Talk it through",
    subtitle: "Anything pediatric, in plain words.",
    iconVariant: "chat",
  },
];

const QUICK_GUIDE_KEY = "pippa.scan.quickGuide.dismissed";

const containerVariants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function ScanCenterPage() {
  const [babyName, setBabyName] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const profile = readProfile();
    if (profile.name && typeof profile.name === "string") {
      setBabyName(profile.name);
    }
    try {
      const dismissed = window.localStorage.getItem(QUICK_GUIDE_KEY);
      if (!dismissed) setShowGuide(true);
    } catch {
      // localStorage may be unavailable in private mode — skip the guide.
    }
  }, []);

  const dismissGuide = () => {
    setShowGuide(false);
    try {
      window.localStorage.setItem(QUICK_GUIDE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const greeting = babyName ? `Hi, ${babyName}'s parent` : "Hi there";

  return (
    <main className="flex-1 bg-cream pb-32">
      <div className="container-app pt-8 flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="text-small text-stone">{greeting}</p>
          <h1 className="font-display text-h1 text-ink">
            What would you like to check?
          </h1>
          <p className="text-small text-stone">
            Pick what&rsquo;s on your mind. Pippa will help you read the signal.
          </p>
        </header>

        {showGuide && (
          <motion.aside
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl bg-peach-soft/60 border border-peach/30 px-4 py-3 pr-10"
            role="region"
            aria-label="Quick guide"
          >
            <p className="text-micro uppercase tracking-wider text-clay font-medium">
              Quick guide
            </p>
            <p className="text-small text-ink mt-1">
              Tap a card below to start. Each one walks you through it — no
              setup needed. Your photos and audio are never stored.
            </p>
            <button
              type="button"
              onClick={dismissGuide}
              aria-label="Dismiss quick guide"
              className="absolute top-2 right-2 size-7 rounded-pill grid place-items-center text-stone hover:text-ink hover:bg-cream/60"
            >
              <X className="size-4" aria-hidden />
            </button>
          </motion.aside>
        )}

        <motion.ul
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-3"
        >
          {CARDS.map((card) => (
            <motion.li key={card.href} variants={itemVariants}>
              <Link
                href={card.href}
                className="group flex items-center gap-4 rounded-2xl bg-cream px-5 py-4 shadow-[var(--shadow-soft)] hover:bg-bone/30 transition-colors"
              >
                <TrackerIcon variant={card.iconVariant} size={56} />
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="font-display text-h3 text-ink">{card.title}</p>
                  <p className="text-small text-stone">{card.subtitle}</p>
                </div>
                <ChevronRight
                  className="size-5 text-stone shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </motion.li>
          ))}
        </motion.ul>

        <p className="text-micro uppercase tracking-wider text-stone text-center pt-4">
          Educational support, not medical diagnosis.
        </p>
      </div>
    </main>
  );
}

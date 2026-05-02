// Scan center — home of the app. Four large character cards route into
// each scan flow plus open chat. Greeting reads from the demo localStorage
// baby profile; falls back to a neutral hello.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Character } from "@/components/primitives/character";
import { readProfile } from "@/components/onboarding/profile-store";

type CardSpec = {
  href: string;
  title: string;
  subtitle: string;
  variant: React.ComponentProps<typeof Character>["variant"];
  bg: NonNullable<React.ComponentProps<typeof Character>["bg"]>;
};

const CARDS: CardSpec[] = [
  {
    href: "/scan/diaper",
    title: "Diaper",
    subtitle: "Show me a photo. I'll read the color and texture.",
    variant: "bear",
    bg: "peach",
  },
  {
    href: "/scan/cry",
    title: "Cry",
    subtitle: "Listen for a few seconds. I'll guess the why.",
    variant: "bottle",
    bg: "soft-blue",
  },
  {
    href: "/scan/rash",
    title: "Rash",
    subtitle: "A photo and a couple of details to triage.",
    variant: "heart",
    bg: "rose",
  },
  {
    href: "/chat",
    title: "Talk it through",
    subtitle: "Anything pediatric, in plain words.",
    variant: "sparkle",
    bg: "lavender",
  },
];

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

  useEffect(() => {
    const profile = readProfile();
    if (profile.name && typeof profile.name === "string") {
      setBabyName(profile.name);
    }
  }, []);

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
                <Character
                  variant={card.variant}
                  bg={card.bg}
                  size="sm"
                  float={false}
                />
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

"use client";

// "Try saying" tips for the voice entry. Lives just under the mic on
// /trackers so a parent who has never used voice logging knows exactly
// what kind of phrase routes into sleep / feed / diaper instead of
// landing in the catch-all "note" bucket.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Moon, Utensils } from "lucide-react";
import { TrackerIcon } from "@/components/icons/tracker-icon";
import { cn } from "@/lib/utils";

type Tip = {
  variant: "sleep" | "feed" | "diaper";
  Icon: typeof Moon;
  label: string;
  examples: string[];
};

const TIPS: Tip[] = [
  {
    variant: "sleep",
    Icon: Moon,
    label: "Sleep",
    examples: [
      "Baby slept at 2pm, woke up at 3pm",
      "She napped for an hour and a half just now",
      "Down for the night at 7:45",
    ],
  },
  {
    variant: "feed",
    Icon: Utensils,
    label: "Feed",
    examples: [
      "Just nursed her on the left for 12 minutes",
      "4oz bottle of formula about an hour ago",
      "Fed at 9am, both sides 10 minutes each",
    ],
  },
  {
    variant: "diaper",
    Icon: Check,
    label: "Diaper",
    examples: [
      "Wet diaper, like 30 minutes ago",
      "She just pooped",
      "Pee and poop diaper at 11am",
    ],
  },
];

export function VoiceTips() {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-bone/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden
            className="size-9 rounded-pill bg-peach-soft text-clay grid place-items-center shrink-0"
          >
            <TrackerIcon variant="note" size={28} />
          </span>
          <div className="flex flex-col min-w-0">
            <p className="text-small font-semibold text-ink">
              Try saying it like this
            </p>
            <p className="text-micro uppercase tracking-wider text-stone">
              Pippa logs sleep, feed & diaper from your voice
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-5 text-stone shrink-0 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="tips-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <ul className="px-5 pb-5 flex flex-col gap-4 border-t border-bone">
              {TIPS.map((tip) => (
                <li key={tip.variant} className="flex flex-col gap-2 pt-3">
                  <div className="flex items-center gap-2">
                    <TrackerIcon variant={tip.variant} size={28} />
                    <p className="font-display text-h3 text-plum">{tip.label}</p>
                  </div>
                  <ul className="flex flex-col gap-1.5 pl-1">
                    {tip.examples.map((ex) => (
                      <li
                        key={ex}
                        className="text-small text-stone leading-snug flex items-start gap-2"
                      >
                        <span
                          aria-hidden
                          className="mt-1.5 size-1.5 rounded-pill bg-peach shrink-0"
                        />
                        <span>&ldquo;{ex}&rdquo;</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

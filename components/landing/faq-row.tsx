"use client";

// Single FAQ row with framer-motion AnimatePresence open/close. The chevron
// rotates 180° when expanded. Each row is a self-contained <details>-style
// disclosure but built as a button + region so we keep a11y consistent and
// the AnimatePresence height transition smooth.
import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  question: string;
  answer: string;
  defaultOpen?: boolean;
};

export function FaqRow({ question, answer, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-b border-bone/70 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-peach/40 rounded-md"
      >
        <span className="font-display text-h3 text-ink">{question}</span>
        <span
          aria-hidden
          className={cn(
            "size-9 grid place-items-center rounded-full bg-peach-soft text-clay shrink-0 transition-transform",
            open && "rotate-180",
          )}
        >
          <ChevronDown className="size-4" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-12 text-body text-stone leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

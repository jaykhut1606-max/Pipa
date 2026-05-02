"use client";

// Bucket detail — hero panel + 4 category cards. Each category expands
// to reveal its checklist; tapping an item toggles completion in the
// localStorage store. Previous / Next nav at the foot scrolls between
// adjacent age buckets.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  Lightbulb,
  MessageSquare,
  Smile,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BUCKETS,
  CATEGORY_META,
  bucketsAround,
  categoriesFor,
  getBucket,
  type Milestone,
  type MilestoneBucket,
  type MilestoneBucketKey,
  type MilestoneCategory,
} from "@/lib/milestones";
import {
  readMilestones,
  setMilestoneCompleted,
  type MilestoneState,
} from "@/components/milestones/milestone-store";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<
  MilestoneCategory,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  cognitive: Lightbulb,
  language: MessageSquare,
  movement: Activity,
  social: Smile,
};

export function BucketDetailClient({ bucketKey }: { bucketKey: string }) {
  const router = useRouter();
  const bucket = getBucket(bucketKey) as MilestoneBucket;
  const { prev, next } = bucketsAround(bucket.key as MilestoneBucketKey);

  const [completed, setCompleted] = useState<MilestoneState>({});
  const [expanded, setExpanded] = useState<MilestoneCategory | null>(null);

  useEffect(() => {
    setCompleted(readMilestones());
  }, []);

  const total = bucket.milestones.length;
  const done = useMemo(
    () => bucket.milestones.filter((m) => completed[m.id]).length,
    [bucket, completed]
  );

  const groups = useMemo(() => categoriesFor(bucket), [bucket]);

  function toggle(id: string) {
    setCompleted((prev) => {
      const next: MilestoneState = { ...prev };
      const isDone = !!prev[id];
      if (isDone) delete next[id];
      else next[id] = true;
      setMilestoneCompleted(id, !isDone);
      return next;
    });
  }

  return (
    <main className="flex-1 bg-cream pb-36">
      <header className="container-app pt-10 flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.back()}
          className="size-10 rounded-pill bg-bone/60 grid place-items-center text-stone hover:text-ink"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <h1 className="font-display text-h2 text-plum">{bucket.label}</h1>
      </header>

      <div className="container-app pt-5 flex flex-col gap-5">
        <div
          className={cn(
            "rounded-2xl h-44 grid place-items-center",
            bucket.bg
          )}
          aria-hidden
        >
          <div className="flex flex-col items-center gap-2 text-plum">
            <Sparkles className="size-12" strokeWidth={1.4} />
            <p className="font-display text-h2">{bucket.shortLabel}</p>
          </div>
        </div>

        <p className="self-center inline-flex items-center gap-2 rounded-pill bg-cream border border-bone px-4 h-9 text-small text-ink shadow-[var(--shadow-soft)]">
          {done} out of {total} completed
        </p>

        <ul className="flex flex-col gap-3">
          {groups.map(({ category, items }) => {
            const meta = CATEGORY_META[category];
            const Icon = CATEGORY_ICON[category];
            const isOpen = expanded === category;
            const doneInGroup = items.filter((i) => completed[i.id]).length;
            return (
              <li
                key={category}
                className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => (prev === category ? null : category))
                  }
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-bone/20 transition-colors"
                >
                  <span
                    className={cn(
                      "size-12 shrink-0 rounded-xl grid place-items-center",
                      meta.iconBg
                    )}
                    aria-hidden
                  >
                    <Icon className="size-6 text-ink" />
                  </span>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-2">
                    <p className="text-small font-medium text-ink leading-snug">
                      {meta.label}
                    </p>
                    <span className="h-1 rounded-pill bg-bone overflow-hidden">
                      <span
                        className={cn("block h-full", meta.tone)}
                        style={{
                          width: `${
                            items.length === 0
                              ? 0
                              : Math.round((doneInGroup / items.length) * 100)
                          }%`,
                        }}
                      />
                    </span>
                  </div>
                  <span className="text-small text-stone shrink-0 mr-1">
                    {doneInGroup} / {items.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-stone shrink-0 transition-transform",
                      isOpen && "rotate-180"
                    )}
                    aria-hidden
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden border-t border-bone"
                    >
                      {items.map((item) => (
                        <li key={item.id}>
                          <MilestoneCheckRow
                            item={item}
                            checked={!!completed[item.id]}
                            onToggle={() => toggle(item.id)}
                          />
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        <nav className="flex items-center justify-between gap-3 pt-4">
          <PrevNextButton bucket={prev} direction="prev" />
          <PrevNextButton bucket={next} direction="next" />
        </nav>
      </div>
    </main>
  );
}

function MilestoneCheckRow({
  item,
  checked,
  onToggle,
}: {
  item: Milestone;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bone/20 transition-colors"
    >
      <span aria-hidden className="w-1 h-7 rounded-pill bg-bone" />
      <p
        className={cn(
          "flex-1 text-small leading-snug",
          checked ? "text-stone line-through" : "text-ink"
        )}
      >
        {item.text}
      </p>
      <span
        className={cn(
          "size-6 rounded-pill grid place-items-center transition-colors",
          checked ? "bg-plum text-cream" : "bg-bone text-stone"
        )}
        aria-hidden
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    </button>
  );
}

function PrevNextButton({
  bucket,
  direction,
}: {
  bucket: MilestoneBucket | null;
  direction: "prev" | "next";
}) {
  const Icon = direction === "prev" ? ArrowLeft : ArrowRight;
  const label = direction === "prev" ? "Previous" : "Next";
  if (!bucket) {
    return (
      <span
        aria-hidden
        className={cn(
          "h-12 px-5 rounded-pill bg-bone/40 text-stone/50 inline-flex items-center gap-2 text-small font-medium",
          direction === "next" && "ml-auto"
        )}
      >
        {direction === "prev" && <Icon className="size-4" aria-hidden />}
        {label}
        {direction === "next" && <Icon className="size-4" aria-hidden />}
      </span>
    );
  }
  return (
    <a
      href={`/milestones/${bucket.key}`}
      className={cn(
        "h-12 px-5 rounded-pill bg-cream border border-bone text-clay font-medium inline-flex items-center gap-2 text-small shadow-[var(--shadow-soft)] hover:bg-bone/20",
        direction === "next" && "ml-auto"
      )}
    >
      {direction === "prev" && <Icon className="size-4" aria-hidden />}
      {label}
      {direction === "next" && <Icon className="size-4" aria-hidden />}
    </a>
  );
}

// Re-export for module-level reference if needed.
export { BUCKETS };

// Client island for the /history timeline. The parent server component
// fetches scans from the in-memory demo store and hands them to us
// already serialized; we own the framer-motion stagger.
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { TimelineItem } from "@/components/primitives/timeline-item";

type TimelineColor = React.ComponentProps<typeof TimelineItem>["color"];

export type TimelineEntry = {
  id: string;
  color: TimelineColor;
  title: string;
  createdAt: string;
};

const containerVariants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function HistoryTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col"
    >
      {entries.map((entry, idx) => {
        const isLast = idx === entries.length - 1;
        return (
          <motion.li key={entry.id} variants={itemVariants}>
            <Link
              href={`/result/${entry.id}`}
              className="block rounded-xl -mx-2 px-2 py-1 hover:bg-bone/30 transition-colors"
            >
              <TimelineItem
                color={entry.color}
                title={entry.title}
                subtitle={formatDistanceToNow(new Date(entry.createdAt), {
                  addSuffix: true,
                })}
                isLast={isLast}
              />
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  messages: ChatMessage[];
  // True while a streaming assistant message is being filled in.
  streaming?: boolean;
};

export function MessageThread({ messages, streaming }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4"
      role="log"
      aria-live="polite"
      aria-label="Chat history"
    >
      {messages.map((m) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "flex gap-2 max-w-[85%]",
            m.role === "user" ? "self-end flex-row-reverse" : "self-start"
          )}
        >
          {m.role === "assistant" && (
            <span className="shrink-0 mt-1">
              <Logo size={28} />
            </span>
          )}
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-body whitespace-pre-wrap",
              m.role === "user"
                ? "bg-peach text-ink rounded-br-sm"
                : "bg-cream text-ink shadow-[var(--shadow-soft)] border border-bone rounded-bl-sm"
            )}
          >
            {m.content || (streaming && m.role === "assistant" ? "…" : "")}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

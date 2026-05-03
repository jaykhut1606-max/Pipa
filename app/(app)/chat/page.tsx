"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { differenceInWeeks } from "date-fns";
import { NavBar } from "@/components/primitives/nav-bar";
import { SpeechBubble } from "@/components/primitives/speech-bubble";
import { MessageThread, type ChatMessage } from "@/components/chat/message-thread";
import { ChatInput } from "@/components/chat/chat-input";
import { toast } from "sonner";

type BabyProfile = {
  name?: string;
  birthDate?: string;
  feedingType?: string[];
};

const STARTER_QUESTIONS = [
  "How much sleep is normal at this age?",
  "When should I worry about a fever?",
  "Tips for cluster feeding tonight?",
];

function uid() {
  return crypto.randomUUID();
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [baby, setBaby] = useState<BabyProfile>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pippa.baby");
      if (raw) setBaby(JSON.parse(raw));
    } catch {
      // localStorage unavailable in private mode — fine.
    }
  }, []);

  async function send(text: string) {
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    const assistantId = uid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    const next = [...messages, userMsg, assistantMsg];
    setMessages(next);
    setStreaming(true);

    const ageWeeks = baby.birthDate
      ? Math.max(0, differenceInWeeks(new Date(), new Date(baby.birthDate)))
      : 0;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next
            .filter((m) => m.id !== assistantId)
            .map(({ role, content }) => ({ role, content })),
          baby: {
            name: baby.name ?? "your baby",
            ageWeeks,
            feedingType: baby.feedingType ?? [],
          },
        }),
      });

      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          (errBody as { error?: string }).error ??
            "Couldn't reach Pippa. Try again?"
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      // Pump tokens into the assistant message.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: buffer } : m
          )
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
      // Remove the empty assistant placeholder on hard failure.
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-cream">
      <NavBar title="Chat with Pippa" showBack backHref="/home" />

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="relative">
            <div className="relative size-44 motion-safe:animate-[float_6s_ease-in-out_infinite]">
              <Image
                src="/images/pippa-mascot.png"
                alt="Pippa mascot"
                fill
                sizes="176px"
                className="object-contain drop-shadow-[0_8px_24px_rgba(245,169,131,0.30)]"
              />
            </div>
            <div className="absolute -top-2 right-[-6px]">
              <SpeechBubble pointer="down">Ask me anything.</SpeechBubble>
            </div>
          </div>
          <div className="flex flex-col gap-2 max-w-sm">
            <h1 className="font-display text-h2 text-ink">
              Pippa is listening.
            </h1>
            <p className="text-body text-stone">
              Sleep, feeding, fevers, weird sounds — start with whatever&rsquo;s
              on your mind.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-sm">
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="text-left px-4 py-3 rounded-2xl bg-cream border border-bone text-body text-ink hover:bg-bone/30 transition-colors shadow-[var(--shadow-soft)]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <MessageThread messages={messages} streaming={streaming} />
      )}

      <ChatInput
        onSend={send}
        disabled={streaming}
        placeholder={
          baby.name ? `Ask about ${baby.name}…` : "Ask Pippa anything…"
        }
      />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  // Pre-fills the textarea once on mount and again whenever the value
  // changes — used by `/today` to seed the chat with today's brief
  // context so the parent picks up mid-conversation.
  defaultValue?: string;
};

export function ChatInput({
  onSend,
  disabled,
  placeholder,
  defaultValue,
}: Props) {
  const [value, setValue] = useState(defaultValue ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (defaultValue !== undefined) {
      setValue(defaultValue);
      // Move caret to the end so the parent can keep typing immediately.
      requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 160) + "px";
      });
    }
  }, [defaultValue]);

  function autoResize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 bg-cream/95 backdrop-blur-md border-t border-bone px-4 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]"
    >
      <div className="container-app flex items-end gap-2">
        <div className="flex-1 rounded-2xl border border-bone bg-cream px-4 py-2 focus-within:border-peach focus-within:ring-3 focus-within:ring-peach/30">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const text = value.trim();
                if (text && !disabled) {
                  onSend(text);
                  setValue("");
                  if (ref.current) ref.current.style.height = "auto";
                }
              }
            }}
            placeholder={placeholder ?? "Ask Pippa anything…"}
            rows={1}
            className="w-full resize-none bg-transparent text-body text-ink placeholder:text-stone/60 focus:outline-none min-h-[40px] max-h-40"
            aria-label="Message"
            disabled={disabled}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          aria-label="Send"
          className={cn(
            "size-12 rounded-pill grid place-items-center transition-colors shrink-0",
            "bg-peach text-ink hover:bg-peach/90",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          <ArrowUp className="size-5" strokeWidth={2.4} aria-hidden />
        </button>
      </div>
    </form>
  );
}

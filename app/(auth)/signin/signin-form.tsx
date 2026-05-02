"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const redirectTo = new URL("/api/auth/callback", window.location.origin);
    if (next) redirectTo.searchParams.set("next", next);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo.toString() },
    });

    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push(`/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-2">
        <span className="text-small text-ink font-medium">Email</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-14 px-4 rounded-lg border border-bone bg-cream text-body text-ink placeholder:text-stone/60 focus:outline-none focus:border-peach focus:ring-2 focus:ring-peach/30"
        />
      </label>

      {error && (
        <p role="alert" className="text-small text-clay">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !email}
        className="h-14 px-6 rounded-pill bg-peach text-ink font-medium hover:bg-peach/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Sending…" : "Send magic link"}
      </button>
    </form>
  );
}

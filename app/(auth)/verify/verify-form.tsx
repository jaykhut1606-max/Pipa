"use client";

// 6-digit OTP input. Calls supabase.auth.verifyOtp with type 'email' to
// finalize the session, then routes by onboarding state.
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function VerifyForm({ email, next }: { email: string; next: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) {
      setError("Missing email — go back and request a new code.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });

    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    // Where to go: explicit `next`, then onboarded-state heuristic from
    // localStorage profile, else /welcome for first-timers.
    let target = next || "/home";
    if (!next) {
      try {
        const profileRaw = window.localStorage.getItem("pippa.baby");
        const profile = profileRaw ? JSON.parse(profileRaw) : null;
        if (!profile?.onboardedAt) target = "/welcome";
      } catch {
        // ignore
      }
    }
    router.replace(target);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-2">
        <span className="text-small text-ink font-medium">Code</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          pattern="[0-9]*"
          maxLength={6}
          required
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
          }
          placeholder="123456"
          className="h-14 px-4 rounded-lg border border-bone bg-cream text-body text-ink tracking-[0.3em] text-center font-display placeholder:text-stone/60 placeholder:tracking-normal focus:outline-none focus:border-peach focus:ring-2 focus:ring-peach/30"
        />
      </label>

      {error && (
        <p role="alert" className="text-small text-clay">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="h-14 px-6 rounded-pill bg-peach text-ink font-medium hover:bg-peach/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Verifying…" : "Continue"}
      </button>

      <Link
        href="/signin"
        className="text-small text-stone underline underline-offset-4 hover:text-ink self-start"
      >
        Use a different email
      </Link>
    </form>
  );
}

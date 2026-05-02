import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="container-app flex flex-1 flex-col justify-center gap-8 py-16">
      <header className="flex flex-col gap-3">
        <Logo size={48} className="mb-2" />
        <h1 className="font-display text-h1 text-ink">Welcome back.</h1>
        <p className="text-body text-stone">
          Enter your email and we&apos;ll send a one-tap link to sign in.
        </p>
      </header>
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="text-micro uppercase tracking-wider text-stone">
        Educational support, not medical advice.
      </p>
    </main>
  );
}

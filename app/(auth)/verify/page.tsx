import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Check your email" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="container-app flex flex-1 flex-col justify-center gap-6 py-16">
      <div className="size-14 rounded-pill bg-peach-soft grid place-items-center">
        <span className="size-6 rounded-pill bg-peach" />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-h1 text-ink">Check your email.</h1>
        <p className="text-body text-stone">
          We sent a sign-in link
          {email ? (
            <>
              {" "}to <span className="text-ink font-medium">{email}</span>
            </>
          ) : null}
          . Tap it to come back here.
        </p>
        <p className="text-small text-stone">
          The link expires in 1 hour. Check spam if you don&apos;t see it.
        </p>
      </div>
      <Link
        href="/signin"
        className="text-small text-stone underline underline-offset-4 hover:text-ink self-start"
      >
        Use a different email
      </Link>
    </main>
  );
}

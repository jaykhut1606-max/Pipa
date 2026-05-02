import type { Metadata } from "next";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Enter your code" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;

  return (
    <main className="container-app flex flex-1 flex-col justify-center gap-6 py-16">
      <div className="size-14 rounded-pill bg-peach-soft grid place-items-center">
        <span className="size-6 rounded-pill bg-peach" />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-h1 text-ink">Enter your code.</h1>
        <p className="text-body text-stone">
          We sent a 6-digit code
          {email ? (
            <>
              {" "}to <span className="text-ink font-medium">{email}</span>
            </>
          ) : null}
          . It expires in 10 minutes.
        </p>
      </div>
      <VerifyForm email={email ?? ""} next={next ?? ""} />
    </main>
  );
}

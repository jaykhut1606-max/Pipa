// Result reveal. Server component reads the demo scan store and hands it to
// the shared result screen. If the scan isn't there (server restart, bad
// link), render a gentle expired-link fallback.
import { Character } from "@/components/primitives/character";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { NavBar } from "@/components/primitives/nav-bar";
import { ResultScreen } from "@/components/scan/result-screen";
import { getDemoScan } from "@/lib/scan-store";

export const metadata = { title: "Result" };

export default async function Page({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  const scan = getDemoScan(scanId);

  if (!scan) {
    return (
      <main className="flex-1 flex flex-col bg-cream">
        <NavBar showBack backHref="/scan" />
        <section className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <Character variant="thinking" bg="cream" size="lg" />
          <div className="flex flex-col gap-2 max-w-sm">
            <h1 className="font-display text-h2 text-ink">
              We couldn&rsquo;t find that scan
            </h1>
            <p className="text-body text-stone">
              The link may have expired. Scans are kept in memory for the demo
              and reset when the server restarts.
            </p>
          </div>
          <PrimaryCTA href="/scan">Back to scans</PrimaryCTA>
        </section>
      </main>
    );
  }

  return <ResultScreen scan={scan} />;
}

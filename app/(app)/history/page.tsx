// History timeline. Server-renders a list of demo scans from the
// in-memory store, maps each to a status color, and hands the timeline
// to a client island for entrance animation.
import { differenceInDays } from "date-fns";
import { NavBar } from "@/components/primitives/nav-bar";
import { Character } from "@/components/primitives/character";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { type DemoScan } from "@/lib/scan-store";
import { listScans } from "@/lib/data/scans";
import {
  HistoryTimeline,
  type TimelineEntry,
} from "@/components/scan-center/history-timeline";

export const metadata = { title: "History" };

type TimelineColor = TimelineEntry["color"];
const ALLOWED_COLORS: ReadonlySet<TimelineColor> = new Set([
  "sage",
  "amber",
  "clay",
  "peach",
  "soft-blue",
  "rose",
]);

const STATUS_COLOR: Record<string, TimelineColor> = {
  healthy: "sage",
  monitor: "amber",
  urgent: "clay",
  unclear: "soft-blue",
};

const CRY_REASON_COLOR: Record<string, TimelineColor> = {
  hungry: "amber",
  tired: "soft-blue",
  discomfort: "rose",
  wind_gas: "rose",
  overstimulated: "amber",
  needs_change: "peach",
  wants_contact: "peach",
  pain: "clay",
  unclear: "soft-blue",
};

const SCAN_TYPE_LABEL: Record<string, string> = {
  diaper: "Diaper",
  cry: "Cry",
  rash: "Rash",
};

function clampColor(color: TimelineColor): TimelineColor {
  return ALLOWED_COLORS.has(color) ? color : "soft-blue";
}

function getCryReason(scan: DemoScan): string | null {
  if (scan.scanType !== "cry") return null;
  const result = scan.result;
  if (!result || typeof result !== "object") return null;
  const primary = (result as { primaryReason?: { label?: string } })
    .primaryReason;
  if (!primary || typeof primary.label !== "string") return null;
  return primary.label;
}

function entryFor(scan: DemoScan): TimelineEntry {
  const cryReason = getCryReason(scan);
  const baseColor =
    cryReason && CRY_REASON_COLOR[cryReason]
      ? CRY_REASON_COLOR[cryReason]
      : STATUS_COLOR[scan.status] ?? "soft-blue";
  const typeLabel = SCAN_TYPE_LABEL[scan.scanType] ?? scan.scanType;
  return {
    id: scan.id,
    color: clampColor(baseColor),
    title: `${typeLabel} · ${scan.primaryLabel}`,
    createdAt: scan.createdAt,
  };
}

export default async function HistoryPage() {
  const scans = await listScans(30);
  const now = new Date();
  const last7 = scans.filter(
    (s) => differenceInDays(now, new Date(s.createdAt)) <= 7
  );
  const entries = scans.map(entryFor);
  const isEmpty = entries.length === 0;

  return (
    <div className="flex-1 flex flex-col bg-cream">
      <NavBar title="History" />

      {isEmpty ? (
        <main className="flex-1 flex flex-col items-center justify-center text-center gap-6 px-6 pb-32">
          <Character variant="stars" bg="lavender" size="lg" />
          <div className="flex flex-col gap-2 max-w-sm">
            <h2 className="font-display text-h2 text-ink">No scans yet</h2>
            <p className="text-body text-stone">
              Try your first scan. It only takes a minute.
            </p>
          </div>
          <PrimaryCTA href="/scan" showArrow>
            Start a scan
          </PrimaryCTA>
          <p className="text-micro uppercase tracking-wider text-stone pt-4">
            All scans were saved on this device only.
          </p>
        </main>
      ) : (
        <main className="container-app py-6 pb-32 flex flex-col gap-6">
          <section className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] px-5 py-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-micro uppercase tracking-wider text-stone">
                Last 7 days
              </p>
              <p className="font-display text-h2 text-ink">
                {last7.length} {last7.length === 1 ? "scan" : "scans"}
              </p>
            </div>
            <Character
              variant="celebrate"
              bg="amber"
              size="sm"
              float={false}
            />
          </section>

          <section className="rounded-2xl bg-cream shadow-[var(--shadow-soft)] px-5 py-5">
            <HistoryTimeline entries={entries} />
          </section>

          <p className="text-micro uppercase tracking-wider text-stone text-center">
            All scans were saved on this device only.
          </p>
        </main>
      )}
    </div>
  );
}

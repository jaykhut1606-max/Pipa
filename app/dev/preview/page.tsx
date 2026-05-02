// Visual QA route — every primitive at every state.
// Returns 404 in production builds to keep it dev-only.
// Client component because we pass inline onClick handlers to PlanCard demos.
"use client";

import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Wordmark } from "@/components/brand/wordmark";
import { PrimaryCTA } from "@/components/primitives/primary-cta";
import { DarkCTA } from "@/components/primitives/dark-cta";
import { ResultBadge } from "@/components/primitives/result-badge";
import { StatusPill } from "@/components/primitives/status-pill";
import { SoothingCard } from "@/components/primitives/soothing-card";
import { PlanCard } from "@/components/primitives/plan-card";
import { TimelineItem } from "@/components/primitives/timeline-item";
import { NavBar } from "@/components/primitives/nav-bar";
import { TabBar } from "@/components/primitives/tab-bar";

// Note: `metadata` exports are server-only. Title falls back to the
// root template — fine for a dev-only route.

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 border-b border-bone pb-2">
        <h2 className="font-display text-h2 text-ink">{title}</h2>
        {description && <p className="text-small text-stone">{description}</p>}
      </header>
      {children && <div className="flex flex-col gap-6">{children}</div>}
    </section>
  );
}

export default function DevPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <NavBar
        title="Dev preview"
        showBack
        backHref="/"
        rightAction={
          <span className="text-micro uppercase tracking-wider text-stone">
            v0
          </span>
        }
      />

      <main className="flex-1 py-10">
        <div className="container-marketing flex flex-col gap-14">
          <Section title="Brand" description="Logo at three sizes, wordmark.">
            <div className="flex items-end gap-8 flex-wrap">
              <Logo size={32} />
              <Logo size={64} />
              <Logo size={128} />
              <Wordmark className="text-h1" />
              <Wordmark className="text-h2 text-stone" />
            </div>
          </Section>

          <Section
            title="Typography"
            description="Fraunces (display) + Inter (sans)."
          >
            <div className="flex flex-col gap-3">
              <p className="font-display text-hero text-ink">Hero · 56</p>
              <p className="font-display text-h1 text-ink">Heading 1 · 38</p>
              <p className="font-display text-h2 text-ink">Heading 2 · 28</p>
              <p className="font-display text-h3 text-ink">Heading 3 · 20</p>
              <p className="text-body text-ink">Body · 17 (Inter, default)</p>
              <p className="text-small text-stone">Small · 14 (Inter, stone)</p>
              <p className="text-micro uppercase tracking-wider text-stone">
                Micro · 12 (uppercase, stone)
              </p>
            </div>
          </Section>

          <Section
            title="Primary CTA"
            description="Peach pill, 56px tall, ink text."
          >
            <div className="flex flex-wrap gap-3">
              <PrimaryCTA>Get started</PrimaryCTA>
              <PrimaryCTA showArrow>Continue</PrimaryCTA>
              <PrimaryCTA loading>Sending</PrimaryCTA>
              <PrimaryCTA disabled>Disabled</PrimaryCTA>
            </div>
            <PrimaryCTA fullWidth showArrow>
              Full width
            </PrimaryCTA>
          </Section>

          <Section title="Dark CTA" description="Ink pill, cream text.">
            <div className="flex flex-wrap gap-3">
              <DarkCTA>Sign in</DarkCTA>
              <DarkCTA showArrow>Continue</DarkCTA>
              <DarkCTA loading>Working</DarkCTA>
              <DarkCTA disabled>Disabled</DarkCTA>
            </div>
          </Section>

          <Section
            title="Result badges"
            description="Seven statuses, three sizes each."
          >
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-6 items-end">
              {(
                [
                  "healthy",
                  "monitor",
                  "urgent",
                  "tired",
                  "hungry",
                  "discomfort",
                  "unclear",
                ] as const
              ).map((status) => (
                <div
                  key={status}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <ResultBadge status={status} size="md" />
                  <span className="text-micro uppercase tracking-wider text-stone">
                    {status}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <ResultBadge status="healthy" size="sm" />
              <ResultBadge status="healthy" size="md" />
              <ResultBadge status="healthy" size="lg" />
            </div>
          </Section>

          <Section title="Status pills">
            <div className="flex flex-wrap gap-2">
              <StatusPill color="sage">All clear</StatusPill>
              <StatusPill color="amber">Worth watching</StatusPill>
              <StatusPill color="clay">Call pediatrician</StatusPill>
              <StatusPill color="peach">Hungry</StatusPill>
              <StatusPill color="soft-blue">Tired</StatusPill>
              <StatusPill color="rose">Discomfort</StatusPill>
              <StatusPill color="stone">Unclear</StatusPill>
            </div>
          </Section>

          <Section title="Soothing card">
            <SoothingCard eyebrow="Soothing tip">
              <p>
                Try a slow side-to-side rock with{" "}
                <strong className="font-medium">Mira</strong> on your shoulder.
                Most cries from over-tiredness settle within 90 seconds of skin
                contact.
              </p>
            </SoothingCard>
          </Section>

          <Section title="Plan cards" description="Subtle and highlighted.">
            <div className="flex flex-col gap-4">
              <PlanCard
                variant="subtle"
                label="Weekly"
                price="$9.99"
                weeklyEquiv="Cancel anytime"
                onClick={() => {}}
              />
              <PlanCard
                variant="highlighted"
                label="Yearly"
                price="$69.99"
                meta="Save 86%"
                weeklyEquiv="$1.34/wk · 3-day free trial"
                onClick={() => {}}
              />
              <PlanCard
                variant="subtle"
                label="Lifetime"
                price="$129"
                weeklyEquiv="One-time"
                onClick={() => {}}
              />
            </div>
          </Section>

          <Section title="Timeline">
            <div className="flex flex-col">
              <TimelineItem
                color="sage"
                title="Diaper · all clear"
                subtitle="Mustard yellow, seedy. Looks normal."
              />
              <TimelineItem
                color="peach"
                title="Cry · likely hungry"
                subtitle="Rhythmic, rising — try a feed first."
              />
              <TimelineItem
                color="amber"
                title="Rash · worth watching"
                subtitle="Diaper area; mild. Re-check tomorrow."
              />
              <TimelineItem
                color="clay"
                title="Diaper · call pediatrician"
                subtitle="Pale stool — same-day evaluation."
                isLast
              />
            </div>
          </Section>

          <Section title="Nav bar (rendered above)" />

          <Section title="Tab bar (rendered below)">
            <p className="text-small text-stone">
              The tab bar is sticky at the bottom of the viewport on app
              routes. Scan is the centered peach tab. Active tab gets a peach
              dot.
            </p>
          </Section>
        </div>
      </main>

      <TabBar />
    </div>
  );
}

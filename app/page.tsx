// Marketing landing — scrolling, multi-section. Sticky header, hero with
// GSAP timeline, trust marquee, two feature rows, testimonials, FAQ,
// pricing teaser, final CTA, footer.
//
// Above-the-fold (sticky header + hero) ships in the initial bundle.
// Everything below is dynamic-imported so the GSAP marquee, the
// chaos→calm illustration, the testimonial/FAQ/pricing components, and
// the footer don't drag down the LCP. They render as soon as the user
// scrolls past the hero — fast enough to feel native.
import dynamic from "next/dynamic";
import { StickyHeader } from "@/components/landing/sticky-header";
import { HeroStage } from "@/components/landing/hero-stage";
import { StatsStrip } from "@/components/landing/stats-strip";
import { SectionHeading } from "@/components/landing/section-heading";
import { Reveal } from "@/components/landing/reveal";
import { FeatureCard } from "@/components/landing/feature-card";

const HowItWorks = dynamic(() =>
  import("@/components/landing/how-it-works").then((m) => m.HowItWorks),
);
const TrustMarquee = dynamic(() =>
  import("@/components/landing/trust-marquee").then((m) => m.TrustMarquee),
);
const MiniChart = dynamic(() =>
  import("@/components/landing/mini-chart").then((m) => m.MiniChart),
);
const TestimonialCard = dynamic(() =>
  import("@/components/landing/testimonial-card").then(
    (m) => m.TestimonialCard,
  ),
);
const FaqRow = dynamic(() =>
  import("@/components/landing/faq-row").then((m) => m.FaqRow),
);
const PricingStrip = dynamic(() =>
  import("@/components/landing/pricing-strip").then((m) => m.PricingStrip),
);
const FinalCta = dynamic(() =>
  import("@/components/landing/final-cta").then((m) => m.FinalCta),
);
const MarketingFooter = dynamic(() =>
  import("@/components/landing/footer").then((m) => m.MarketingFooter),
);
const ChaosToCalmSection = dynamic(() =>
  import("@/components/landing/chaos-to-calm-section").then(
    (m) => m.ChaosToCalmSection,
  ),
);

const READS = [
  {
    variant: "diaper" as const,
    title: "Diaper colors",
    body: "Snap a photo. Pippa flags pale, bloody, or unusually green stools — and tells you what to do next.",
  },
  {
    variant: "cry" as const,
    title: "Cries",
    body: "10 seconds of audio is enough to differentiate hunger, gas, tired, and discomfort patterns.",
  },
  {
    variant: "rash" as const,
    title: "Rashes",
    body: "Spot eczema vs. heat rash vs. something that needs a doctor — in seconds, with reasoned guidance.",
  },
];

const TRACKS = [
  {
    variant: "sleep" as const,
    title: "Sleep",
    body: "Tap to start, tap to stop. We handle naps, cycles, and total daily averages.",
  },
  {
    variant: "feed" as const,
    title: "Feeds",
    body: "Bottle, breast, or solids — log in three taps. Volumes and intervals roll up automatically.",
  },
  {
    variant: "insights" as const,
    title: "Insights",
    body: "Daily, weekly, and monthly views. Pippa surfaces patterns before you have to look for them.",
  },
];

const TESTIMONIALS = [
  {
    initial: "M",
    tone: "peach" as const,
    quote:
      "Pippa caught a pale stool I didn't recognize. Pediatrician saw us same day. I'm so grateful.",
    name: "Maya R.",
    meta: "Mom of one · 4 mo",
  },
  {
    initial: "J",
    tone: "sage" as const,
    quote:
      "The cry analyzer turned 2am from panic into a plan. It's like having a calm friend on call.",
    name: "Jordan & Pat",
    meta: "Twins · 9 wk",
  },
  {
    initial: "S",
    tone: "soft-blue" as const,
    quote:
      "I stopped doom-scrolling forums. Pippa explains things clearly, with sources and next steps.",
    name: "Sana K.",
    meta: "Dad of two · 7 mo",
  },
];

const FAQS = [
  {
    question: "Is this medical advice?",
    answer:
      "No — Pippa is educational support. We help you decide between 'all is well' and 'call the doctor.' For diagnoses or treatment, please consult your pediatrician.",
  },
  {
    question: "Where does my data live?",
    answer:
      "Logs and profiles live encrypted on our servers, tied only to your account. You can export or delete everything at any time from Settings.",
  },
  {
    question: "Do you store photos?",
    answer:
      "No. Photos for diaper and rash scans are processed in memory and immediately discarded. Only the structured result (the assessment) is saved with your scan history.",
  },
  {
    question: "What does it cost?",
    answer:
      "Try the demo free, no signup. Plans start at $9.99/week or $69.99/year (about $1.34/wk) with a 3-day trial. Lifetime is $129 once.",
  },
  {
    question: "Will it wake the baby?",
    answer:
      "The cry analyzer listens silently — no sounds, flashes, or vibrations. You can also use the timeline view one-handed, in the dark.",
  },
];

export default function HomePage() {
  return (
    <>
      <StickyHeader />

      {/* Hero band — peach gradient extends just under the fold */}
      <div className="noise-overlay relative bg-gradient-to-br from-vivid-peach-soft via-peach-soft to-cream">
        <HeroStage />
      </div>

      {/* By-the-numbers proof points — sets credibility before the trust chips */}
      <StatsStrip />

      <TrustMarquee />

      {/* How it works — three steps, plain English */}
      <HowItWorks />

      {/* Section: What Pippa reads — center aligned */}
      <section className="container-marketing py-20 sm:py-24 flex flex-col gap-12">
        <SectionHeading
          eyebrow="Scans"
          title="What Pippa reads."
          body="Three quick scans for the moments that need a second opinion fast."
          align="center"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {READS.map((card, i) => (
            <FeatureCard key={card.variant} {...card} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* Section: What Pippa tracks — left-aligned to break rhythm */}
      <section className="bg-cream/60 border-y border-bone/60">
        <div className="container-marketing py-20 sm:py-24 flex flex-col gap-12">
          <SectionHeading
            eyebrow="Tracker"
            title="And tracks the rest of the day."
            body="Three taps to log a sleep, feed, or diaper. We do the math — daily, weekly, monthly insights, in your baby's name."
            align="left"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {TRACKS.map((card, i) => (
              <FeatureCard key={card.variant} {...card} delay={i * 0.08} />
            ))}
          </div>
          <Reveal className="mt-2">
            <MiniChart />
          </Reveal>
        </div>
      </section>

      {/* Section: Chaos → Calm transformation */}
      <ChaosToCalmSection />

      {/* Section: Testimonials */}
      <section className="container-marketing py-20 sm:py-24 flex flex-col gap-12">
        <SectionHeading
          eyebrow="Parents"
          title="Pippa shows up in real moments."
          body="Three families, three different nights. Same calm guide."
          align="center"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} {...t} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* Section: FAQ — left aligned to break rhythm again */}
      <section className="bg-cream/60 border-y border-bone/60">
        <div className="container-marketing py-20 sm:py-24 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-16">
          <SectionHeading
            eyebrow="FAQ"
            title="Quick answers, plainly."
            body="Don't see yours? Drop us a line — pippa@pippa.app."
            align="left"
          />
          <Reveal>
            <div className="rounded-2xl bg-cream border border-bone p-2 sm:p-4 shadow-[var(--shadow-soft)]">
              {FAQS.map((faq, i) => (
                <FaqRow
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                  defaultOpen={i === 0}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Section: Pricing teaser */}
      <section className="container-marketing py-20 sm:py-24">
        <PricingStrip />
      </section>

      <FinalCta />
      <MarketingFooter />
    </>
  );
}

# Pippa

Understand your baby. AI scans for cries, diapers, and rashes — built with pediatricians.

> **Educational support, not medical advice.** Pippa pattern-matches against published pediatric guidance. It will never diagnose. When anything is concerning, it will tell you to call your pediatrician.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript strict
- Tailwind CSS v4 (CSS-first theme in `app/globals.css`)
- shadcn/ui (base-nova style, Base UI primitives)
- Supabase (Postgres, Auth, Storage)
- OpenAI GPT-4o (vision + audio)
- Stripe (subscriptions + lifetime)
- Resend (transactional email)
- PostHog (analytics)
- Vercel (hosting)

## Local dev

```bash
cp .env.example .env.local   # fill in keys — see spec Part 1
npm install
npm run dev
```

Open <http://localhost:3000>.

## Repository map

```
app/
  (marketing)/     public, indexed
  (auth)/          sign-in, magic-link verify
  (app)/           auth-required: welcome, onboarding, scan, result, history, chat, settings
  api/             route handlers: scan/{diaper,cry,rash}, chat, stripe, tracker, auth/callback
  paywall/         standalone paywall
components/
  ui/              shadcn primitives
  brand/           Logo, Wordmark
  primitives/      Pippa-specific: PrimaryCTA, ResultBadge, SoothingCard, etc.
  scan/            PhotoCapture, AudioCapture, AnalyzingState
  chat/            MessageThread, ChatInput
  paywall/         PaywallModal
  pwa/             InstallPrompt, ServiceWorkerRegister
lib/
  supabase/        client (browser), server (RSC + route handlers)
  openai/          client + per-scan-type prompts + safety overrides
  stripe/          client, webhook handler
  analytics/       PostHog event constants
supabase/
  migrations/      0001_init.sql, 0002_rls.sql, 0003_indexes.sql
proxy.ts           auth gate (Next 16 renamed middleware → proxy)
```

## Build status

See `STATUS.md`. We work phase-by-phase per the master spec.

## Reference

- Master spec: `~/Downloads/pippa-architecture.md` (kept out of the repo intentionally — it's a working contract, not docs)
- AI conventions: `CLAUDE.md`
- Next 16 deltas: `CLAUDE.md` § "Stack deltas vs spec"

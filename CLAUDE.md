@AGENTS.md

# Pippa-specific notes for AI agents

The full architecture spec lives at `/Users/jay/Downloads/pippa-architecture.md` (Pippa Master Spec v1.0). It is the contract — when in doubt, check it. If something is missing, default to: **warmer, simpler, less clinical**.

## Build phases

We work phase-by-phase. The current phase is tracked in `STATUS.md`. Don't jump ahead.

## Stack deltas vs spec

The spec is written for Next.js 15. We're on **Next.js 16.2.4** because that is what `create-next-app@latest` installs as of 2026-05. Practical differences you must respect:

- `middleware.ts` is **renamed to `proxy.ts`**. Function name is `proxy`, not `middleware`. Same matcher, same NextRequest/NextResponse semantics. (See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.)
- `params` and `searchParams` are **Promises** in pages. Always `await params` / `await searchParams`. Type as `Promise<{ ... }>`.
- `cookies()` and `headers()` are async — `const c = await cookies()`.
- Tailwind is v4 with **CSS-first theme config** in `app/globals.css` via `@theme { ... }`. There is no `tailwind.config.ts`. Brand tokens live there.
- shadcn/ui uses the **base-nova** style which depends on **Base UI** (`@base-ui/react/*`), not Radix. Buttons import from `@base-ui/react/button`.
- For instant client navigation between scan and result, consider `export const unstable_instant = { prefetch: 'static' }` per `node_modules/next/dist/docs/01-app/02-guides/instant-navigation.md`. Don't enable it speculatively — only when a measurable UX issue is observed.

## Conventions enforced from the spec

- Color tokens only — never raw hex. Use `text-ink`, `bg-peach`, `bg-peach-soft`, etc.
- Fonts: `font-display` (Fraunces) for headlines, `font-sans` (Inter) by default.
- Every interactive element ≥ 44px tap target; primary CTAs are 56px tall.
- Cream background everywhere — never pure white.
- One primary CTA per screen.
- Animations: `cubic-bezier(0.16, 1, 0.3, 1)` or `ease-out`. No spring/bounce.
- "Trust your instinct" copy on every concern (urgent) screen.
- Photos and audio are **never stored** — only structured AI output (color hex, confidence, label) lands in `scans.result`.
- TypeScript strict; `any` requires a comment justifying it.
- All API routes wrap in try/catch and return structured errors.

## File-system map

The spec's directory layout (Part 2.2) is authoritative. Key groups:

- `app/(marketing)/*` — public, indexed
- `app/(app)/*` — auth-required
- `app/(auth)/*` — sign-in, verify
- `app/api/*` — route handlers; structure is `/api/[domain]/[action]`
- `lib/openai/prompts/*` — system prompts as constants per scan type
- `lib/openai/safety.ts` — hardcoded overrides (pale stool, blood, fever-under-12-weeks). These are NEVER trusted to the model.
- `supabase/migrations/*` — schema, RLS, indexes (run via Supabase CLI)

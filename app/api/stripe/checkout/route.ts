import { NextResponse } from "next/server";

// Stripe checkout — wire-up arrives when STRIPE_SECRET_KEY + price IDs land
// in env. The structured 501 below is what the paywall UI handles gracefully.
//
// When ready, replace this body with the spec Part 8.2 implementation:
//   1. Read tier from request JSON
//   2. Look up the price ID from NEXT_PUBLIC_STRIPE_PRICE_{WEEKLY|YEARLY|LIFETIME}
//   3. Find or create the Stripe customer for the current user
//   4. stripe.checkout.sessions.create({ mode, line_items, success_url, cancel_url, ... })
//   5. Return { url: session.url }
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Subscriptions are not enabled in this build yet. Drop your Stripe keys into .env.local and we'll wire it up.",
    },
    { status: 501 }
  );
}

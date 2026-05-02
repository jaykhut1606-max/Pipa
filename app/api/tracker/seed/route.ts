// Demo helper — seeds 7 days of plausible sleep/diaper/feed events so the
// charts and insights have something to render before real logs exist.
// Returns no-op JSON if the store is already populated.
import { NextResponse } from "next/server";
import { seedDemoEvents } from "@/lib/data/events";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const babyName = url.searchParams.get("babyName") ?? "Baby";
  const seeded = await seedDemoEvents(babyName);
  return NextResponse.json({ seeded });
}

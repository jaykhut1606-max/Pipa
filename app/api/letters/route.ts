// GET /api/letters?babyName=...
// Returns the list of saved weekly letters for the given baby, newest
// first. Used by /journal to render the timeline of past weeks.
import { NextResponse } from "next/server";
import { listLetters } from "@/lib/data/letters";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const babyName = (url.searchParams.get("babyName") ?? "Baby").trim() || "Baby";
  const limitRaw = Number(url.searchParams.get("limit") ?? "30");
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 60) : 30;

  const letters = await listLetters(babyName, limit);
  return NextResponse.json(
    { letters },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    },
  );
}

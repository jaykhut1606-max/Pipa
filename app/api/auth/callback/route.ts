// Magic-link consumption. Supabase redirects the email link here with
// `?code=...`; we exchange it for a session, then route the user to
// either /welcome (first time) or /scan (returning).
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error.message)}`
    );
  }

  // If the user came from a protected route, send them back there.
  if (next && next.startsWith("/")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Otherwise route by onboarding state.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/signin?error=no_user`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  // Returning users skip /welcome; first-timers see the intro.
  const target = profile?.onboarded_at ? "/home" : "/welcome";
  return NextResponse.redirect(`${origin}${target}`);
}

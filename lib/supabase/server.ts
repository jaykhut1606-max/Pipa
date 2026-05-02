// Server-side Supabase client. Use in Server Components, route handlers,
// and Server Actions. Reads/writes the user session via Next's cookie store.
//
// Spec Part 5.2. The cookie setter is wrapped in try/catch because Server
// Components can't mutate cookies — that's expected and harmless; the
// proxy refreshes the session on the next request.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't set cookies. Proxy handles refresh.
          }
        },
      },
    }
  );
}

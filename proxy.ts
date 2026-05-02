// Pippa auth gate — Next 16 renamed `middleware.ts` to `proxy.ts`.
// Refreshes Supabase session on every request and redirects unauthenticated
// users away from app routes (and authenticated users away from auth routes).
//
// Spec Part 5.2. The cookie plumbing pattern below is non-obvious — the
// `setAll` callback both mutates the incoming request (so downstream
// handlers see the refreshed session) AND the outgoing response (so the
// browser persists the new cookie). Don't simplify without re-reading
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// and the @supabase/ssr migration guide.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/welcome",
  "/onboarding",
  "/scan",
  "/result",
  "/history",
  "/chat",
  "/settings",
];
const AUTH_ROUTES = ["/signin", "/verify"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touch the session so @supabase/ssr can refresh it if it's about to expire.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_ROUTES.some((r) => path.startsWith(r));
  const isAuth = AUTH_ROUTES.some((r) => path.startsWith(r));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isAuth && user) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next internals, static files, and image optimization.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

// Pippa auth gate — Next 16 renamed `middleware.ts` to `proxy.ts`.
// This is a working stub for Phase 0; Phase 1 wires Supabase session refresh
// per spec Part 5.2. Do not add more logic here without checking the
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// guide first.
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

export function proxy(_request: NextRequest) {
  // Phase 1 will replace this with Supabase session refresh + redirects.
  // Listing route arrays here so the codemod-style migration in Phase 1 is
  // a small diff, not a rewrite.
  void PROTECTED_ROUTES;
  void AUTH_ROUTES;
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

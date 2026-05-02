// Auth-flow routes (sign-in, magic-link verify). Proxy.ts redirects
// already-authenticated users to /welcome.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

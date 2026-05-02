// Auth-protected layout. Phase 1 wires Supabase session check + redirect
// to /signin for unauthenticated users. The bottom TabBar is rendered
// conditionally per spec Part 3.4 (only on history/scan/profile).
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

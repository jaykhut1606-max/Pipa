// Belt-and-suspenders auth gate. The proxy already redirects unauth users,
// but a server-side check here lets us hand the session down to children
// and short-circuits before any UI renders.
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  return <>{children}</>;
}

// Demo mode: auth gate is disabled so anyone can walk the flow.
// The original gate is preserved below — re-enable when shipping.
//
// import { redirect } from "next/navigation";
// import { createSupabaseServerClient } from "@/lib/supabase/server";
//
// const supabase = await createSupabaseServerClient();
// const { data: { user } } = await supabase.auth.getUser();
// if (!user) redirect("/signin");
import { TabBar } from "@/components/primitives/tab-bar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex-1 flex flex-col">{children}</div>
      <TabBar />
    </>
  );
}

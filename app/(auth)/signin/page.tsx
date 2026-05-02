import { StubPage } from "@/components/_dev/StubPage";

export const metadata = { title: "Sign in" };

export default function Page() {
  return (
    <StubPage
      title="Sign in"
      phase="Phase 1"
      meta="Magic-link form. POST email to Supabase Auth, redirect to /verify."
    />
  );
}

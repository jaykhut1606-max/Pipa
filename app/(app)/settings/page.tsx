import { StubPage } from "@/components/_dev/StubPage";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <StubPage
      title="Settings"
      phase="Phase 8"
      meta="Profile, baby info, subscription management (Stripe Customer Portal deep-link), delete-my-data."
    />
  );
}

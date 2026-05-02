import { StubPage } from "@/components/_dev/StubPage";

export const metadata = { title: "Check your email" };

export default function Page() {
  return (
    <StubPage
      title="Check your email"
      phase="Phase 1"
      meta="Confirmation screen post-magic-link request. Includes resend button."
    />
  );
}

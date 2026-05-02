import { StubPage } from "@/components/_dev/StubPage";

export const metadata = { title: "Cry analyzer" };

export default function Page() {
  return (
    <StubPage
      title="Cry analyzer"
      phase="Phase 5"
      meta="Audio capture (5-15s) → analyzing → /result/[scanId]. Audio never stored."
    />
  );
}

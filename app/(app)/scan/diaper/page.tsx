import { StubPage } from "@/components/_dev/StubPage";

export const metadata = { title: "Diaper scan" };

export default function Page() {
  return (
    <StubPage
      title="Diaper scan"
      phase="Phase 4"
      meta="Camera viewport → analyzing → /result/[scanId]. Photo never stored."
    />
  );
}

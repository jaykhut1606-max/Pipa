import { StubPage } from "@/components/_dev/StubPage";

export const metadata = { title: "Welcome" };

export default function Page() {
  return (
    <StubPage
      title="Welcome"
      phase="Phase 3"
      meta="Post-signup intro. Caption: 'Educational support, not medical advice.' First-time only."
    />
  );
}

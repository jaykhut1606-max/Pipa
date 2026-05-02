import { StubPage } from "@/components/_dev/StubPage";

export const metadata = { title: "Rash check" };

export default function Page() {
  return (
    <StubPage
      title="Rash check"
      phase="Phase 5"
      meta="Photo + body location chips + duration + fever → /result/[scanId]."
    />
  );
}

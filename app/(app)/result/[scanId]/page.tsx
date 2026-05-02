import { StubPage } from "@/components/_dev/StubPage";

export const metadata = { title: "Result" };

export default async function Page({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const { scanId } = await params;
  return (
    <StubPage
      title="Scan result"
      phase="Phase 4"
      meta={`Result reveal for scan ${scanId}. Three variants: healthy / monitor / urgent.`}
    />
  );
}

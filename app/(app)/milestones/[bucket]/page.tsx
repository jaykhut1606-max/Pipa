// Milestone bucket detail. Server wrapper awaits params (Next 16 promise
// API); the actual interactive UI lives in BucketDetailClient.
import { notFound } from "next/navigation";
import { getBucket } from "@/lib/milestones";
import { BucketDetailClient } from "./bucket-detail-client";

export default async function MilestoneBucketPage({
  params,
}: {
  params: Promise<{ bucket: string }>;
}) {
  const { bucket } = await params;
  if (!getBucket(bucket)) notFound();
  return <BucketDetailClient bucketKey={bucket} />;
}

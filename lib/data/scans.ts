// Dual-mode scans adapter.
//
// When SUPABASE_SERVICE_ROLE_KEY is set in the environment, reads + writes
// go through the service-role Supabase client (RLS is bypassed because
// demo mode doesn't have a real auth.uid()). Otherwise, everything falls
// through to the in-memory demo store in lib/scan-store.ts.
//
// All functions are async to keep callers consistent across modes.
//
// Column mapping (DemoScan ↔ public.scans):
//   id              ↔ id (uuid)
//   scanType        ↔ scan_type
//   status          ↔ status
//   primaryLabel    ↔ primary_label
//   babyName        ↔ demo_baby_name (added in 0004)
//   babyAgeWeeks    ↔ input_metadata.ageWeeks (jsonb)
//   result          ↔ result (jsonb)
//   safetyOverride  ↔ safety_override_reason (+ safety_override_applied bool)
//   createdAt       ↔ created_at
//
// baby_id and profile_id are left null in demo mode (allowed since 0004).
import {
  saveDemoScan,
  getDemoScan,
  listDemoScans,
  type DemoScan,
} from "@/lib/scan-store";
import { getAdminClient, isSupabaseEnabled } from "@/lib/supabase/admin";
import type { ScanStatus, ScanType } from "@/lib/types";

type ScanRow = {
  id: string;
  scan_type: string;
  status: string | null;
  primary_label: string | null;
  demo_baby_name: string | null;
  input_metadata: { ageWeeks?: number } | null;
  result: unknown;
  safety_override_applied: boolean | null;
  safety_override_reason: string | null;
  created_at: string;
};

function rowToScan(row: ScanRow): DemoScan {
  return {
    id: row.id,
    scanType: (row.scan_type as ScanType) ?? "diaper",
    status: (row.status as ScanStatus) ?? "unclear",
    primaryLabel: row.primary_label ?? "—",
    babyName: row.demo_baby_name ?? "Baby",
    babyAgeWeeks:
      typeof row.input_metadata?.ageWeeks === "number"
        ? row.input_metadata.ageWeeks
        : 0,
    result: row.result,
    safetyOverride: row.safety_override_reason ?? undefined,
    createdAt: row.created_at,
  };
}

export async function saveScan(scan: DemoScan): Promise<DemoScan> {
  if (!isSupabaseEnabled()) return saveDemoScan(scan);
  const sb = getAdminClient()!;
  const { error } = await sb.from("scans").insert({
    id: scan.id,
    scan_type: scan.scanType,
    input_metadata: { ageWeeks: scan.babyAgeWeeks },
    result: scan.result,
    status: scan.status,
    primary_label: scan.primaryLabel,
    safety_override_applied: !!scan.safetyOverride,
    safety_override_reason: scan.safetyOverride ?? null,
    demo_baby_name: scan.babyName,
    created_at: scan.createdAt,
  });
  if (error) {
    console.error(
      "[scans.saveScan] supabase insert failed; falling back to demo store",
      error
    );
    return saveDemoScan(scan);
  }
  return scan;
}

export async function getScan(id: string): Promise<DemoScan | undefined> {
  if (!isSupabaseEnabled()) return getDemoScan(id);
  const sb = getAdminClient()!;
  const { data, error } = await sb
    .from("scans")
    .select(
      "id, scan_type, status, primary_label, demo_baby_name, input_metadata, result, safety_override_applied, safety_override_reason, created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error(
      "[scans.getScan] supabase select failed; falling back to demo store",
      error
    );
    return getDemoScan(id);
  }
  if (!data) return undefined;
  return rowToScan(data as unknown as ScanRow);
}

export async function listScans(limit = 30): Promise<DemoScan[]> {
  if (!isSupabaseEnabled()) return listDemoScans(limit);
  const sb = getAdminClient()!;
  const { data, error } = await sb
    .from("scans")
    .select(
      "id, scan_type, status, primary_label, demo_baby_name, input_metadata, result, safety_override_applied, safety_override_reason, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error(
      "[scans.listScans] supabase select failed; falling back to demo store",
      error
    );
    return listDemoScans(limit);
  }
  return ((data as unknown as ScanRow[]) ?? []).map(rowToScan);
}

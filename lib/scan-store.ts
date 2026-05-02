// In-memory demo store. Persists across requests within a single Node process
// and survives Turbopack hot reloads via globalThis. Resets on server restart.
//
// When auth + DB come back online, swap callers to insert into the
// `scans` table instead. The shape here is intentionally a superset
// of what the DB stores so the swap is mechanical.
import type { ScanType, ScanStatus } from "@/lib/types";

export type DemoScan = {
  id: string;
  scanType: ScanType;
  status: ScanStatus;
  primaryLabel: string;
  babyName: string;
  babyAgeWeeks: number;
  result: unknown;
  safetyOverride?: string;
  createdAt: string;
};

type Store = Map<string, DemoScan>;

declare global {
  // eslint-disable-next-line no-var
  var __pippa_scan_store: Store | undefined;
}

const store: Store =
  globalThis.__pippa_scan_store ?? (globalThis.__pippa_scan_store = new Map());

export function saveDemoScan(scan: DemoScan) {
  store.set(scan.id, scan);
  return scan;
}

export function getDemoScan(id: string): DemoScan | undefined {
  return store.get(id);
}

export function listDemoScans(limit = 30): DemoScan[] {
  return Array.from(store.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function clearDemoScans() {
  store.clear();
}

import "server-only";

import { ingestRecent8Ks } from "@/lib/scan/ingest";
import type { ScanMode } from "@/lib/types";

export type RunSignalScanInput = {
  tickers: string[];
  mode?: ScanMode;
  runType?: "manual" | "scheduled" | "reprocess";
};

export async function runSignalScan(input: RunSignalScanInput) {
  return ingestRecent8Ks(input.tickers, {
    mode: input.mode ?? (input.runType === "reprocess" ? "reprocess" : "new"),
  });
}

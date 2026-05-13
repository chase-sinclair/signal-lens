import { NextResponse } from "next/server";
import { z } from "zod";

import { errorMessage } from "@/lib/errors";
import { ingestRecent8Ks } from "@/lib/scan/ingest";

const scanRequestSchema = z.object({
  tickers: z.array(z.string()).min(1).max(25),
  mode: z.enum(["new", "reprocess"]).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = scanRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Request must include 1-25 ticker symbols." },
      { status: 400 },
    );
  }

  try {
    const result = await ingestRecent8Ks(parsed.data.tickers, {
      mode: parsed.data.mode,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: errorMessage(error, "SignalLens scan failed unexpectedly."),
      },
      { status: 500 },
    );
  }
}

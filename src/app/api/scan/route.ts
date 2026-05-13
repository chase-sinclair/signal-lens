import { NextResponse } from "next/server";
import { z } from "zod";

import { ingestRecent8Ks } from "@/lib/scan/ingest";

const scanRequestSchema = z.object({
  tickers: z.array(z.string()).min(1).max(25),
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
    const result = await ingestRecent8Ks(parsed.data.tickers);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "SignalLens scan failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}

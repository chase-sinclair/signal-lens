import { NextResponse } from "next/server";
import { z } from "zod";

import { errorMessage } from "@/lib/errors";
import { resolveTickers } from "@/lib/sec";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  tickers: z.array(z.string()).min(1).max(100),
});

async function getCrowdStrikeSellerId() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("seller_companies")
    .select("id")
    .eq("name", "CrowdStrike")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Request must include 1-100 ticker symbols." },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseServiceClient();
    const sellerCompanyId = await getCrowdStrikeSellerId();
    const resolved = await resolveTickers(parsed.data.tickers);
    const errors: string[] = [];
    let saved = 0;

    for (const company of resolved) {
      if ("error" in company) {
        errors.push(company.error);
        continue;
      }

      const { data: target, error: targetError } = await supabase
        .from("target_companies")
        .upsert(
          { ticker: company.ticker, cik: company.cik, name: company.name },
          { onConflict: "ticker" },
        )
        .select("id")
        .single();

      if (targetError) throw targetError;

      const { error: monitorError } = await supabase
        .from("monitored_targets")
        .upsert(
          {
            seller_company_id: sellerCompanyId,
            target_company_id: target.id,
            active: true,
          },
          { onConflict: "seller_company_id,target_company_id" },
        );

      if (monitorError) throw monitorError;
      saved += 1;
    }

    return NextResponse.json({ saved, errors });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error, "Failed to save monitored targets.") },
      { status: 500 },
    );
  }
}

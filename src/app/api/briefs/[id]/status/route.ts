import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  status: z.enum(["New", "Reviewed", "Relevant", "Not Relevant", "Archived"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid brief status." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase
      .from("briefs")
      .update({ status: parsed.data.status })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ id, status: parsed.data.status });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Brief status update failed unexpectedly.",
      },
      { status: 500 },
    );
  }
}

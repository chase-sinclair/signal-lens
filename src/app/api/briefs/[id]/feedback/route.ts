import { NextResponse } from "next/server";
import { z } from "zod";

import { errorMessage } from "@/lib/errors";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const feedbackSchema = z.object({
  relevant: z.boolean(),
  rating: z.number().int().min(1).max(5).optional(),
  feedbackText: z.string().max(2000).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("user_feedback").insert({
      brief_id: id,
      relevant_boolean: parsed.data.relevant,
      rating: parsed.data.rating ?? null,
      feedback_text: parsed.data.feedbackText ?? null,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error, "Failed to save feedback.") },
      { status: 500 },
    );
  }
}

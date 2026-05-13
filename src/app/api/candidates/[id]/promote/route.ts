import { NextResponse } from "next/server";

import { errorMessage } from "@/lib/errors";
import { generateBrief, type ClassificationResult } from "@/lib/openai";
import { BRIEF_CONFIDENCE_THRESHOLD } from "@/lib/scan/config";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("signal_candidates")
      .select(
        `
        id,
        scan_run_id,
        seller_company_id,
        filing_id,
        chunk_id,
        prefilter_keyword_matches,
        llm_classification,
        llm_confidence,
        rationale,
        filing:filings(
          id,
          target_company_id,
          filing_type,
          filing_date,
          sec_url,
          target:target_companies(name,ticker)
        ),
        chunk:filing_chunks(text),
        module:signal_modules(
          name,
          description,
          default_keywords,
          strong_trigger_examples,
          weak_signal_examples
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    const candidate = data as unknown as {
      scan_run_id: string;
      seller_company_id: string;
      filing_id: string;
      prefilter_keyword_matches: string[];
      llm_classification: ClassificationResult["classification"] | null;
      llm_confidence: number | null;
      rationale: string | null;
      filing: {
        target_company_id: string;
        filing_type: string;
        filing_date: string;
        sec_url: string;
        target: { name: string; ticker: string };
      };
      chunk: { text: string };
      module: {
        name: string;
        description: string;
        default_keywords: string[];
        strong_trigger_examples: string[];
        weak_signal_examples: string[];
      };
    };

    const classification: ClassificationResult = {
      classification: candidate.llm_classification ?? "Actionable Signal",
      signal_module: candidate.module.name,
      confidence: candidate.llm_confidence ?? BRIEF_CONFIDENCE_THRESHOLD,
      is_boilerplate: false,
      evidence_snippet: "",
      rationale:
        candidate.rationale ??
        "Candidate manually promoted after reviewer inspection.",
      should_generate_brief: true,
    };

    const brief = await generateBrief({
      module: {
        name: candidate.module.name,
        description: candidate.module.description,
        defaultKeywords: candidate.module.default_keywords,
        strongTriggerExamples: candidate.module.strong_trigger_examples,
        weakSignalExamples: candidate.module.weak_signal_examples,
        priorityWeight: 1,
      },
      classification,
      targetCompany: candidate.filing.target.name,
      ticker: candidate.filing.target.ticker,
      filingType: candidate.filing.filing_type,
      filingDate: candidate.filing.filing_date,
      filingUrl: candidate.filing.sec_url,
      chunkText: candidate.chunk.text,
    });

    const { data: persisted, error: briefError } = await supabase
      .from("briefs")
      .insert({
        scan_run_id: candidate.scan_run_id,
        seller_company_id: candidate.seller_company_id,
        target_company_id: candidate.filing.target_company_id,
        filing_id: candidate.filing_id,
        source_candidate_id: id,
        title: brief.title,
        trigger_type: brief.triggerType,
        urgency: brief.urgency,
        confidence_score: brief.confidenceScore,
        evidence_snippet: brief.evidenceSnippet,
        why_it_matters: brief.whyItMatters,
        buyer_personas: brief.buyerPersonas,
        suggested_sales_motion: brief.suggestedSalesMotion,
        suggested_outreach_angle: brief.suggestedOutreachAngle,
        outreach_sensitivity: brief.outreachSensitivity,
        recommended_next_step: brief.recommendedNextStep,
        why_flagged: brief.whyFlagged,
      })
      .select("id,status")
      .single();

    if (briefError) throw briefError;

    return NextResponse.json({
      id: persisted.id,
      status: persisted.status,
      sellerCompany: "CrowdStrike",
      targetCompany: candidate.filing.target.name,
      ticker: candidate.filing.target.ticker,
      filingUrl: candidate.filing.sec_url,
      ...brief,
    });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error, "Failed to promote candidate.") },
      { status: 500 },
    );
  }
}

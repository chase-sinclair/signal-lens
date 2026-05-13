import "server-only";

import { errorMessage } from "@/lib/errors";
import { htmlToText, chunkFilingText } from "@/lib/filing-parser";
import { classifyCandidate, generateBrief } from "@/lib/openai";
import { prefilterChunk } from "@/lib/signal-prefilter";
import { crowdStrikeProfile } from "@/lib/signal-profile";
import {
  fetchFilingText,
  fetchRecent8Ks,
  resolveTickers,
  type SecResolvedCompany,
} from "@/lib/sec";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { SalesActionBrief, ScanEvent, ScanMode } from "@/lib/types";
import { activeModelName, BRIEF_CONFIDENCE_THRESHOLD } from "@/lib/scan/config";

export type IngestedChunk = {
  id?: string;
  filingId?: string;
  targetCompanyId?: string;
  ticker: string;
  targetCompanyName: string;
  accessionNumber: string;
  filingType: string;
  filingDate: string;
  reportDate: string | null;
  secUrl: string;
  primaryDocumentUrl: string;
  chunkIndex: number;
  sectionLabel: string;
  text: string;
  sourceUrl: string;
};

export type IngestionResult = {
  scanRunId: string | null;
  mode: ScanMode;
  chunks: IngestedChunk[];
  briefs: SalesActionBrief[];
  events: ScanEvent[];
  notification: {
    shouldNotify: boolean;
    channel: "none" | "brief_created";
    message: string;
  };
  telemetry: {
    model: string;
    briefConfidenceThreshold: number;
    classificationsRun: number;
  };
  errors: string[];
  summary: {
    filingsScanned: number;
    newFilingsProcessed: number;
    filingsSkipped: number;
    candidatesFound: number;
    briefsGenerated: number;
    filingsSuppressed: number;
  };
};

function normalizeTickers(tickers: string[]) {
  return Array.from(
    new Set(
      tickers
        .map((ticker) => ticker.trim().toUpperCase())
        .filter((ticker) => /^[A-Z0-9.-]{1,8}$/.test(ticker)),
    ),
  );
}

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

async function persistTarget(company: SecResolvedCompany) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("target_companies")
    .upsert(
      { ticker: company.ticker, cik: company.cik, name: company.name },
      { onConflict: "ticker" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function findExistingFilingId(
  targetCompanyId: string,
  accessionNumber: string,
) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("filings")
    .select("id")
    .eq("target_company_id", targetCompanyId)
    .eq("accession_number", accessionNumber)
    .maybeSingle();

  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}

async function persistFiling(
  targetCompanyId: string,
  filing: Omit<
    IngestedChunk,
    "chunkIndex" | "sectionLabel" | "text" | "sourceUrl"
  >,
) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("filings")
    .upsert(
      {
        target_company_id: targetCompanyId,
        accession_number: filing.accessionNumber,
        filing_type: filing.filingType,
        filing_date: filing.filingDate,
        report_date: filing.reportDate,
        sec_url: filing.secUrl,
        primary_document_url: filing.primaryDocumentUrl,
      },
      { onConflict: "target_company_id,accession_number" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function persistChunk(filingId: string, chunk: IngestedChunk) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("filing_chunks")
    .upsert(
      {
        filing_id: filingId,
        chunk_index: chunk.chunkIndex,
        section_label: chunk.sectionLabel,
        text: chunk.text,
        source_url: chunk.sourceUrl,
      },
      { onConflict: "filing_id,chunk_index" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function moduleIdsByName() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.from("signal_modules").select("id,name");
  if (error) throw error;

  return new Map(
    (data ?? []).map((module) => [module.name as string, module.id as string]),
  );
}

async function persistCandidate(input: {
  scanRunId: string;
  filingId: string;
  chunkId: string;
  sellerCompanyId: string;
  signalModuleId: string | null;
  keywordMatches: string[];
  rationale: string;
}) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("signal_candidates")
    .insert({
      scan_run_id: input.scanRunId,
      filing_id: input.filingId,
      chunk_id: input.chunkId,
      seller_company_id: input.sellerCompanyId,
      signal_module_id: input.signalModuleId,
      prefilter_keyword_matches: input.keywordMatches,
      rationale: input.rationale,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function updateCandidateClassification(input: {
  candidateId: string;
  classification: string;
  confidence: number;
  rationale: string;
}) {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("signal_candidates")
    .update({
      llm_classification: input.classification,
      llm_confidence: input.confidence,
      rationale: input.rationale,
    })
    .eq("id", input.candidateId);

  if (error) throw error;
}

async function persistBrief(input: {
  scanRunId: string;
  sellerCompanyId: string;
  targetCompanyId: string;
  filingId: string;
  sourceCandidateId?: string;
  brief: Awaited<ReturnType<typeof generateBrief>>;
}) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("briefs")
    .insert({
      scan_run_id: input.scanRunId,
      seller_company_id: input.sellerCompanyId,
      target_company_id: input.targetCompanyId,
      filing_id: input.filingId,
      source_candidate_id: input.sourceCandidateId ?? null,
      title: input.brief.title,
      trigger_type: input.brief.triggerType,
      urgency: input.brief.urgency,
      confidence_score: input.brief.confidenceScore,
      evidence_snippet: input.brief.evidenceSnippet,
      why_it_matters: input.brief.whyItMatters,
      buyer_personas: input.brief.buyerPersonas,
      suggested_sales_motion: input.brief.suggestedSalesMotion,
      suggested_outreach_angle: input.brief.suggestedOutreachAngle,
      outreach_sensitivity: input.brief.outreachSensitivity,
      recommended_next_step: input.brief.recommendedNextStep,
      why_flagged: input.brief.whyFlagged,
    })
    .select("id,status")
    .single();

  if (error) throw error;
  return data as { id: string; status: SalesActionBrief["status"] };
}

async function persistScanEvent(scanRunId: string, event: ScanEvent) {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("scan_events").insert({
    scan_run_id: scanRunId,
    event_type: event.type,
    candidate_id: event.candidateId ?? null,
    ticker: event.ticker ?? null,
    target_company: event.targetCompany ?? null,
    accession_number: event.accessionNumber ?? null,
    filing_date: event.filingDate ?? null,
    filing_url: event.filingUrl ?? null,
    section_label: event.sectionLabel ?? null,
    signal_module: event.signalModule ?? null,
    keyword_matches: event.keywordMatches ?? [],
    classification: event.classification ?? null,
    confidence: event.confidence ?? null,
    rationale: event.rationale,
  });

  if (error) throw error;
}

export async function ingestRecent8Ks(
  tickers: string[],
  options: { mode?: ScanMode } = {},
) {
  const mode = options.mode ?? "new";
  const normalizedTickers = normalizeTickers(tickers);
  const result: IngestionResult = {
    scanRunId: null,
    mode,
    chunks: [],
    briefs: [],
    events: [],
    notification: {
      shouldNotify: false,
      channel: "none",
      message: "No notification: scan has not completed.",
    },
    telemetry: {
      model: activeModelName(),
      briefConfidenceThreshold: BRIEF_CONFIDENCE_THRESHOLD,
      classificationsRun: 0,
    },
    errors: [],
    summary: {
      filingsScanned: 0,
      newFilingsProcessed: 0,
      filingsSkipped: 0,
      candidatesFound: 0,
      briefsGenerated: 0,
      filingsSuppressed: 0,
    },
  };

  const sellerCompanyId = await getCrowdStrikeSellerId();
  const supabase = getSupabaseServiceClient();
  const moduleIds = await moduleIdsByName();
  const { data: scanRun, error: scanRunError } = await supabase
    .from("scan_runs")
    .insert({
      seller_company_id: sellerCompanyId,
      run_type: "manual",
      scan_mode: mode,
      status: "running",
    })
    .select("id")
    .single();

  if (scanRunError) throw scanRunError;
  result.scanRunId = scanRun.id as string;

  async function logEvent(event: ScanEvent) {
    result.events.push(event);
    await persistScanEvent(result.scanRunId as string, event);
  }

  const resolved = await resolveTickers(normalizedTickers);

  for (const companyResult of resolved) {
    if ("error" in companyResult) {
      result.errors.push(companyResult.error);
      await logEvent({
        type: "scan_error",
        ticker: companyResult.ticker,
        rationale: companyResult.error,
      });
      continue;
    }

    try {
      const targetCompanyId = await persistTarget(companyResult);
      const filings = await fetchRecent8Ks(companyResult, 3);

      for (const filing of filings) {
        result.summary.filingsScanned += 1;
        const existingFilingId = await findExistingFilingId(
          targetCompanyId,
          filing.accessionNumber,
        );

        if (existingFilingId && mode === "new") {
          result.summary.filingsSkipped += 1;
          await logEvent({
            type: "filing_skipped",
            ticker: companyResult.ticker,
            targetCompany: companyResult.name,
            accessionNumber: filing.accessionNumber,
            filingDate: filing.filingDate,
            filingUrl: filing.secUrl,
            rationale:
              "Already-seen filing skipped. SignalLens processes new filings by default.",
          });
          continue;
        }

        result.summary.newFilingsProcessed += 1;
        await logEvent({
          type: "filing_processed",
          ticker: companyResult.ticker,
          targetCompany: companyResult.name,
          accessionNumber: filing.accessionNumber,
          filingDate: filing.filingDate,
          filingUrl: filing.secUrl,
          rationale:
            mode === "reprocess"
              ? "Recent filing reprocessed by manual override."
              : "New filing detected and processed.",
        });

        const html = await fetchFilingText(filing);
        const text = htmlToText(html);
        const chunks = chunkFilingText(text, filing.primaryDocumentUrl);
        const filingId = await persistFiling(targetCompanyId, {
          targetCompanyId,
          ticker: companyResult.ticker,
          targetCompanyName: companyResult.name,
          accessionNumber: filing.accessionNumber,
          filingType: filing.filingType,
          filingDate: filing.filingDate,
          reportDate: filing.reportDate,
          secUrl: filing.secUrl,
          primaryDocumentUrl: filing.primaryDocumentUrl,
        });

        for (const parsedChunk of chunks) {
          const ingestedChunk: IngestedChunk = {
            targetCompanyId,
            filingId,
            ticker: companyResult.ticker,
            targetCompanyName: companyResult.name,
            accessionNumber: filing.accessionNumber,
            filingType: filing.filingType,
            filingDate: filing.filingDate,
            reportDate: filing.reportDate,
            secUrl: filing.secUrl,
            primaryDocumentUrl: filing.primaryDocumentUrl,
            ...parsedChunk,
          };
          ingestedChunk.id = await persistChunk(filingId, ingestedChunk);
          result.chunks.push(ingestedChunk);

          const allMatches = prefilterChunk(ingestedChunk.text);
          const prefilterMatches = allMatches.filter(
            (match) => !match.isBoilerplate,
          );

          for (const match of allMatches.filter((item) => item.isBoilerplate)) {
            await logEvent({
              type: "filing_suppressed",
              ticker: ingestedChunk.ticker,
              targetCompany: ingestedChunk.targetCompanyName,
              accessionNumber: ingestedChunk.accessionNumber,
              filingDate: ingestedChunk.filingDate,
              filingUrl: ingestedChunk.secUrl,
              sectionLabel: ingestedChunk.sectionLabel,
              signalModule: match.moduleName,
              keywordMatches: match.keywordMatches,
              rationale: match.rationale,
            });
          }

          for (const match of prefilterMatches) {
            const candidateId = await persistCandidate({
              scanRunId: result.scanRunId,
              filingId,
              chunkId: ingestedChunk.id,
              sellerCompanyId,
              signalModuleId: moduleIds.get(match.moduleName) ?? null,
              keywordMatches: match.keywordMatches,
              rationale: match.rationale,
            });
            result.summary.candidatesFound += 1;
            await logEvent({
              type: "candidate_found",
              candidateId,
              ticker: ingestedChunk.ticker,
              targetCompany: ingestedChunk.targetCompanyName,
              accessionNumber: ingestedChunk.accessionNumber,
              filingDate: ingestedChunk.filingDate,
              filingUrl: ingestedChunk.secUrl,
              sectionLabel: ingestedChunk.sectionLabel,
              signalModule: match.moduleName,
              keywordMatches: match.keywordMatches,
              rationale: match.rationale,
            });

            const signalModule = crowdStrikeProfile.modules.find(
              (item) => item.name === match.moduleName,
            );
            if (!signalModule) continue;

            const classification = await classifyCandidate({
              module: signalModule,
              chunkText: ingestedChunk.text,
            });
            result.telemetry.classificationsRun += 1;

            await updateCandidateClassification({
              candidateId,
              classification: classification.classification,
              confidence: classification.confidence,
              rationale: classification.rationale,
            });

            if (
              classification.should_generate_brief &&
              !classification.is_boilerplate &&
              classification.confidence >= BRIEF_CONFIDENCE_THRESHOLD &&
              (classification.classification === "Actionable Signal" ||
                classification.classification === "High-Urgency Signal")
            ) {
              const brief = await generateBrief({
                module: signalModule,
                classification,
                targetCompany: ingestedChunk.targetCompanyName,
                ticker: ingestedChunk.ticker,
                filingType: ingestedChunk.filingType,
                filingDate: ingestedChunk.filingDate,
                filingUrl: ingestedChunk.secUrl,
                chunkText: ingestedChunk.text,
              });

              const persistedBrief = await persistBrief({
                scanRunId: result.scanRunId,
                sellerCompanyId,
                targetCompanyId,
                filingId,
                sourceCandidateId: candidateId,
                brief,
              });
              result.summary.briefsGenerated += 1;
              result.briefs.push({
                id: persistedBrief.id,
                status: persistedBrief.status,
                sellerCompany: "CrowdStrike",
                targetCompany: ingestedChunk.targetCompanyName,
                ticker: ingestedChunk.ticker,
                filingUrl: ingestedChunk.secUrl,
                ...brief,
              });
              await logEvent({
                type: "brief_generated",
                candidateId,
                ticker: ingestedChunk.ticker,
                targetCompany: ingestedChunk.targetCompanyName,
                accessionNumber: ingestedChunk.accessionNumber,
                filingDate: ingestedChunk.filingDate,
                filingUrl: ingestedChunk.secUrl,
                sectionLabel: ingestedChunk.sectionLabel,
                signalModule: match.moduleName,
                keywordMatches: match.keywordMatches,
                classification: classification.classification,
                confidence: classification.confidence,
                rationale:
                  "Candidate met the action threshold and generated a Sales Action Brief.",
              });
            } else {
              await logEvent({
                type: "candidate_rejected",
                candidateId,
                ticker: ingestedChunk.ticker,
                targetCompany: ingestedChunk.targetCompanyName,
                accessionNumber: ingestedChunk.accessionNumber,
                filingDate: ingestedChunk.filingDate,
                filingUrl: ingestedChunk.secUrl,
                sectionLabel: ingestedChunk.sectionLabel,
                signalModule: match.moduleName,
                keywordMatches: match.keywordMatches,
                classification: classification.classification,
                confidence: classification.confidence,
                rationale:
                  classification.rationale ||
                  "Candidate did not meet the actionable/high-urgency brief threshold.",
              });
            }
          }
        }
      }
    } catch (error) {
      const message = `${companyResult.ticker}: ${errorMessage(
        error,
        "Unknown SEC ingestion error",
      )}`;
      result.errors.push(message);
      await logEvent({
        type: "scan_error",
        ticker: companyResult.ticker,
        targetCompany: companyResult.name,
        rationale: message,
      });
    }
  }

  result.summary.filingsSuppressed = Math.max(
    0,
    result.summary.newFilingsProcessed - result.summary.candidatesFound,
  );

  await supabase
    .from("scan_runs")
    .update({
      completed_at: new Date().toISOString(),
      status: result.errors.length > 0 ? "completed_with_errors" : "completed",
      total_filings_scanned: result.summary.filingsScanned,
      total_filings_skipped: result.summary.filingsSkipped,
      total_candidates: result.summary.candidatesFound,
      total_briefs_generated: result.summary.briefsGenerated,
      total_filings_suppressed: result.summary.filingsSuppressed,
    })
    .eq("id", result.scanRunId);

  result.notification =
    result.summary.briefsGenerated > 0
      ? {
          shouldNotify: true,
          channel: "brief_created",
          message: `${result.summary.briefsGenerated} SignalLens brief${
            result.summary.briefsGenerated === 1 ? "" : "s"
          } generated for CrowdStrike.`,
        }
      : {
          shouldNotify: false,
          channel: "none",
          message: "No notification: no actionable briefs generated.",
        };

  return result;
}

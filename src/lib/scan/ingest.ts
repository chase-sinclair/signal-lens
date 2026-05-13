import "server-only";

import { htmlToText, chunkFilingText } from "@/lib/filing-parser";
import { prefilterChunk } from "@/lib/signal-prefilter";
import {
  fetchFilingText,
  fetchRecent8Ks,
  resolveTickers,
  type SecResolvedCompany,
} from "@/lib/sec";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

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
  chunks: IngestedChunk[];
  errors: string[];
  summary: {
    filingsScanned: number;
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
      {
        ticker: company.ticker,
        cik: company.cik,
        name: company.name,
      },
      { onConflict: "ticker" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

async function persistFiling(
  targetCompanyId: string,
  chunk: Omit<IngestedChunk, "chunkIndex" | "sectionLabel" | "text" | "sourceUrl">,
) {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("filings")
    .upsert(
      {
        target_company_id: targetCompanyId,
        accession_number: chunk.accessionNumber,
        filing_type: chunk.filingType,
        filing_date: chunk.filingDate,
        report_date: chunk.reportDate,
        sec_url: chunk.secUrl,
        primary_document_url: chunk.primaryDocumentUrl,
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
  const { error } = await supabase.from("signal_candidates").insert({
    scan_run_id: input.scanRunId,
    filing_id: input.filingId,
    chunk_id: input.chunkId,
    seller_company_id: input.sellerCompanyId,
    signal_module_id: input.signalModuleId,
    prefilter_keyword_matches: input.keywordMatches,
    rationale: input.rationale,
  });

  if (error) throw error;
}

export async function ingestRecent8Ks(tickers: string[]) {
  const normalizedTickers = normalizeTickers(tickers);
  const result: IngestionResult = {
    scanRunId: null,
    chunks: [],
    errors: [],
    summary: {
      filingsScanned: 0,
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
      status: "running",
    })
    .select("id")
    .single();

  if (scanRunError) throw scanRunError;
  result.scanRunId = scanRun.id as string;

  const resolved = await resolveTickers(normalizedTickers);

  for (const companyResult of resolved) {
    if ("error" in companyResult) {
      result.errors.push(companyResult.error);
      continue;
    }

    try {
      const targetCompanyId = await persistTarget(companyResult);
      const filings = await fetchRecent8Ks(companyResult, 3);

      for (const filing of filings) {
        result.summary.filingsScanned += 1;
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

          const prefilterMatches = prefilterChunk(ingestedChunk.text).filter(
            (match) => !match.isBoilerplate,
          );

          for (const match of prefilterMatches) {
            await persistCandidate({
              scanRunId: result.scanRunId,
              filingId,
              chunkId: ingestedChunk.id,
              sellerCompanyId,
              signalModuleId: moduleIds.get(match.moduleName) ?? null,
              keywordMatches: match.keywordMatches,
              rationale: match.rationale,
            });
            result.summary.candidatesFound += 1;
          }
        }
      }
    } catch (error) {
      result.errors.push(
        `${companyResult.ticker}: ${
          error instanceof Error ? error.message : "Unknown SEC ingestion error"
        }`,
      );
    }
  }

  result.summary.filingsSuppressed = Math.max(
    0,
    result.summary.filingsScanned - result.summary.candidatesFound,
  );

  await supabase
    .from("scan_runs")
    .update({
      completed_at: new Date().toISOString(),
      status: result.errors.length > 0 ? "completed_with_errors" : "completed",
      total_filings_scanned: result.summary.filingsScanned,
      total_candidates: result.summary.candidatesFound,
      total_briefs_generated: result.summary.briefsGenerated,
      total_filings_suppressed: result.summary.filingsSuppressed,
    })
    .eq("id", result.scanRunId);

  return result;
}

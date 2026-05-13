"use client";

import { useMemo, useState } from "react";
import {
  crowdStrikeProfile,
  getSellerProfile,
  sellerProfiles,
} from "@/lib/signal-profile";
import type {
  BriefStatus,
  SalesActionBrief,
  ScanEvent,
  ScanMode,
  ScanResult,
} from "@/lib/types";

const statusOptions: BriefStatus[] = [
  "New",
  "Reviewed",
  "Relevant",
  "Not Relevant",
  "Archived",
];

const emptyResult: ScanResult = {
  scanRunId: "not-run",
  mode: "new",
  summary: {
    filingsScanned: 0,
    newFilingsProcessed: 0,
    filingsSkipped: 0,
    candidatesFound: 0,
    briefsGenerated: 0,
    filingsSuppressed: 0,
  },
  telemetry: {
    model: "gpt-4o-mini",
    briefConfidenceThreshold: 0.75,
    classificationsRun: 0,
  },
  briefs: [],
  events: [],
  notification: {
    shouldNotify: false,
    channel: "none",
    message: "No notification: no scan has run.",
  },
  errors: [],
};

const mockBrief: SalesActionBrief = {
  id: "demo-crowdstrike-brief",
  title: "Potential Cybersecurity Incident Disclosure",
  sellerCompany: "CrowdStrike",
  targetCompany: "Example Corp",
  ticker: "EXMPL",
  filingType: "8-K / Exhibit 99.1",
  filingDate: "YYYY-MM-DD",
  filingUrl: "https://www.sec.gov/Archives/edgar/",
  triggerType: "Cybersecurity incident disclosure",
  urgency: "High",
  confidenceScore: 91,
  evidenceSnippet:
    "The company disclosed unauthorized access to customer data and remediation activity.",
  whyItMatters:
    "This points to board-level cyber risk and potential urgency around endpoint detection, identity protection, incident response, and threat visibility.",
  buyerPersonas: crowdStrikeProfile.buyerPersonas,
  suggestedSalesMotion:
    "Route to Enterprise Security AE and Security Solutions Engineer.",
  suggestedOutreachAngle:
    "Lead with incident readiness, threat visibility, endpoint protection, and board-level cyber risk reporting.",
  outreachSensitivity:
    "High. Avoid fear-based language or directly saying the company was breached. Use resilience and risk readiness language.",
  recommendedNextStep:
    "Create a strategic account task and review existing account ownership.",
  whyFlagged:
    "Matched CrowdStrike profile under Cybersecurity Incident because the filing described unauthorized access and customer data exposure.",
  status: "New",
};

const mockEvents: ScanEvent[] = [
  {
    type: "filing_processed",
    ticker: "EXMPL",
    targetCompany: "Example Corp",
    accessionNumber: "0000000000-26-000001",
    filingDate: "YYYY-MM-DD",
    rationale: "New filing detected and processed.",
  },
  {
    type: "candidate_found",
    ticker: "EXMPL",
    targetCompany: "Example Corp",
    signalModule: "Cybersecurity Incident",
    keywordMatches: ["unauthorized access", "customer data"],
    rationale:
      "Matched CrowdStrike keywords with concrete filing language.",
  },
  {
    type: "brief_generated",
    ticker: "EXMPL",
    targetCompany: "Example Corp",
    signalModule: "Cybersecurity Incident",
    classification: "High-Urgency Signal",
    confidence: 0.91,
    rationale:
      "Candidate met the action threshold and generated a Sales Action Brief.",
  },
];

function briefToText(brief: SalesActionBrief) {
  return `Sales Action Brief

For: ${brief.sellerCompany} Sales Team
Target Account: ${brief.targetCompany} (${brief.ticker})
Source: ${brief.filingType}
Filing Date: ${brief.filingDate}
Trigger Type: ${brief.triggerType}
Priority: ${brief.urgency}
Confidence: ${brief.confidenceScore}%

Evidence:
"${brief.evidenceSnippet}"

Why ${brief.sellerCompany} Should Care:
${brief.whyItMatters}

Likely Buyer Personas:
${brief.buyerPersonas.map((persona) => `- ${persona}`).join("\n")}

Suggested Sales Motion:
${brief.suggestedSalesMotion}

Suggested Outreach Angle:
${brief.suggestedOutreachAngle}

Outreach Sensitivity:
${brief.outreachSensitivity}

Recommended Next Step:
${brief.recommendedNextStep}

Why This Was Flagged:
${brief.whyFlagged}
`;
}

function postScanMessage(result: ScanResult) {
  if (result.scanRunId === "not-run") {
    return "No scan results yet. Run a scan to check new SEC 8-K filings, or load the demo result to preview the review workflow.";
  }

  if (result.summary.filingsSkipped > 0 && result.summary.newFilingsProcessed === 0) {
    return "No new filings found. Already-seen filings were skipped because SignalLens processes new filings by default.";
  }

  if (result.summary.candidatesFound > 0) {
    return "New filings were reviewed. Candidates were classified below the brief threshold; inspect the scan log for rationale.";
  }

  if (result.summary.newFilingsProcessed > 0) {
    return "New filings were reviewed, but no seller-relevant candidates were found.";
  }

  return "No actionable briefs generated for this scan.";
}

function eventLabel(event: ScanEvent) {
  const labels: Record<ScanEvent["type"], string> = {
    filing_processed: "Processed",
    filing_skipped: "Skipped",
    filing_suppressed: "Suppressed",
    candidate_found: "Candidate",
    candidate_rejected: "Rejected",
    brief_generated: "Brief",
    scan_error: "Error",
  };

  return labels[event.type];
}

export function Dashboard() {
  const [tickers, setTickers] = useState("MSFT\nOKTA\nCRWD");
  const [sellerCompany, setSellerCompany] = useState("CrowdStrike");
  const [scanMode, setScanMode] = useState<ScanMode>("new");
  const [result, setResult] = useState<ScanResult>(emptyResult);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(
    null,
  );
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBrief =
    result.briefs.find((brief) => brief.id === selectedBriefId) ??
    result.briefs[0] ??
    null;
  const selectedEvent =
    selectedEventIndex === null ? null : result.events[selectedEventIndex] ?? null;

  const normalizedTickers = useMemo(
    () =>
      tickers
        .split(/[\s,]+/)
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean),
    [tickers],
  );
  const selectedSellerProfile = getSellerProfile(sellerCompany);

  function loadDemo() {
    setResult({
      scanRunId: "demo-run",
      mode: "reprocess",
      summary: {
        filingsScanned: 8,
        newFilingsProcessed: 8,
        filingsSkipped: 0,
        candidatesFound: 2,
        briefsGenerated: 1,
        filingsSuppressed: 6,
      },
      telemetry: {
        model: "gpt-4o-mini",
        briefConfidenceThreshold: 0.75,
        classificationsRun: 1,
      },
      briefs: [mockBrief],
      events: mockEvents,
      notification: {
        shouldNotify: true,
        channel: "brief_created",
        message: "1 SignalLens brief generated for CrowdStrike.",
      },
      errors: [],
    });
    setSelectedBriefId(mockBrief.id);
    setSelectedEventIndex(2);
    setIsDemoLoaded(true);
  }

  async function runScan() {
    setIsScanning(true);
    setError(null);
    setIsDemoLoaded(false);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: normalizedTickers, mode: scanMode }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Scan failed.");

      const nextResult = data as ScanResult;
      setResult(nextResult);
      setSelectedBriefId(nextResult.briefs[0]?.id ?? null);
      setSelectedEventIndex(nextResult.events.length > 0 ? 0 : null);
      if (nextResult.errors.length > 0) setError(nextResult.errors.join(" "));
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : "Scan failed unexpectedly.",
      );
    } finally {
      setIsScanning(false);
    }
  }

  async function saveMonitoredTargets() {
    setError(null);

    try {
      const response = await fetch("/api/monitored-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: normalizedTickers }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Save failed.");

      setError(
        data.errors?.length
          ? `Saved ${data.saved} monitored target(s). ${data.errors.join(" ")}`
          : `Saved ${data.saved} monitored target(s).`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save monitored targets.",
      );
    }
  }

  async function updateStatus(status: BriefStatus) {
    if (!selectedBrief) return;
    setResult((current) => ({
      ...current,
      briefs: current.briefs.map((brief) =>
        brief.id === selectedBrief.id ? { ...brief, status } : brief,
      ),
    }));

    if (selectedBrief.id.startsWith("demo-")) return;

    try {
      const response = await fetch(`/api/briefs/${selectedBrief.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Status update failed.");
      }
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Status update failed unexpectedly.",
      );
    }
  }

  async function promoteCandidate(event: ScanEvent) {
    if (!event.candidateId || event.candidateId.startsWith("fixture-")) return;
    setError(null);

    try {
      const response = await fetch(
        `/api/candidates/${event.candidateId}/promote`,
        { method: "POST" },
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Promotion failed.");

      const promotedBrief = data as SalesActionBrief;
      setResult((current) => ({
        ...current,
        briefs: [promotedBrief, ...current.briefs],
        summary: {
          ...current.summary,
          briefsGenerated: current.summary.briefsGenerated + 1,
        },
        notification: {
          shouldNotify: true,
          channel: "brief_created",
          message: "1 candidate manually promoted to a brief.",
        },
      }));
      setSelectedBriefId(promotedBrief.id);
    } catch (promotionError) {
      setError(
        promotionError instanceof Error
          ? promotionError.message
          : "Promotion failed unexpectedly.",
      );
    }
  }

  async function submitFeedback(brief: SalesActionBrief, relevant: boolean) {
    if (brief.id.startsWith("demo-") || brief.id.startsWith("fixture-")) {
      setError(`Marked fixture brief as ${relevant ? "relevant" : "not relevant"}.`);
      return;
    }

    try {
      const response = await fetch(`/api/briefs/${brief.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relevant, rating: relevant ? 5 : 2 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Feedback failed.");
      setError(`Feedback saved: ${relevant ? "relevant" : "not relevant"}.`);
    } catch (feedbackError) {
      setError(
        feedbackError instanceof Error
          ? feedbackError.message
          : "Feedback failed unexpectedly.",
      );
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <main className="min-h-screen bg-[#eef1f5] text-[#101828]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-[#d5dae3] bg-[#f8fafc] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#64748b]">
                SignalLens AI
              </p>
              <h1 className="mt-2 text-2xl font-semibold">SEC signal router</h1>
            </div>
            <div className="h-9 w-9 border border-[#cbd5e1] bg-white" />
          </div>

          <section className="mt-8">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              Seller company
            </label>
            <select
              className="mt-2 h-11 w-full border border-[#cbd5e1] bg-white px-3 text-sm font-medium outline-none focus:border-[#2563eb]"
              value={sellerCompany}
              onChange={(event) => setSellerCompany(event.target.value)}
            >
              {sellerProfiles.map((profile) => (
                <option key={profile.companyName}>{profile.companyName}</option>
              ))}
            </select>
            {sellerCompany !== "CrowdStrike" ? (
              <p className="mt-2 text-sm leading-6 text-[#9a3412]">
                Live SEC scanning is CrowdStrike-only in this slice. Other
                profiles are ready for fixture/demo and the next backend map.
              </p>
            ) : null}
          </section>

          <section className="mt-6">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              Target tickers
            </label>
            <textarea
              className="mt-2 min-h-32 w-full resize-y border border-[#cbd5e1] bg-white p-3 font-mono text-sm leading-6 outline-none focus:border-[#2563eb]"
              value={tickers}
              onChange={(event) => setTickers(event.target.value)}
            />
            <p className="mt-2 text-sm text-[#64748b]">
              {normalizedTickers.length} target
              {normalizedTickers.length === 1 ? "" : "s"} queued for 8-K scan.
            </p>
          </section>

          <section className="mt-5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              Scan mode
            </label>
            <div className="mt-2 grid grid-cols-2 border border-[#cbd5e1] bg-white">
              {[
                ["new", "New only"],
                ["reprocess", "Reprocess"],
                ["fixture", "Fixture"],
              ].map(([value, label]) => (
                <button
                  className={`h-10 text-sm font-semibold ${
                    scanMode === value
                      ? "bg-[#111827] text-white"
                      : "text-[#334155]"
                  }`}
                  key={value}
                  onClick={() => setScanMode(value as ScanMode)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <button
            className="mt-6 h-11 w-full bg-[#111827] px-4 text-sm font-semibold text-white transition hover:bg-[#273244] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isScanning || normalizedTickers.length === 0}
            onClick={runScan}
            type="button"
          >
            {isScanning ? "Scanning SEC filings..." : "Run Scan"}
          </button>
          <button
            className="mt-3 h-10 w-full border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-[#334155] transition hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={normalizedTickers.length === 0}
            onClick={saveMonitoredTargets}
            type="button"
          >
            Save monitored targets
          </button>
          <button
            className="mt-3 h-10 w-full border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-[#334155] transition hover:bg-[#f1f5f9]"
            onClick={loadDemo}
            type="button"
          >
            {isDemoLoaded ? "Demo scan loaded" : "Load demo result"}
          </button>

          {error ? (
            <div className="mt-4 border border-[#fecaca] bg-[#fff1f2] p-3 text-sm leading-6 text-[#9f1239]">
              {error}
            </div>
          ) : null}

          <section className="mt-8 border border-[#d5dae3] bg-white p-4">
            <h2 className="text-sm font-semibold">
              {selectedSellerProfile.companyName} profile
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              {selectedSellerProfile.productsSummary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSellerProfile.modules.map((module) => (
                <span
                  className="border border-[#d5dae3] px-2 py-1 text-xs text-[#334155]"
                  key={module.name}
                >
                  {module.name}
                </span>
              ))}
            </div>
          </section>
        </aside>

        <section className="p-5 md:p-8">
          <div className="grid gap-3 md:grid-cols-6">
            {[
              ["Filings", result.summary.filingsScanned],
              ["New", result.summary.newFilingsProcessed],
              ["Skipped", result.summary.filingsSkipped],
              ["Candidates", result.summary.candidatesFound],
              ["Briefs", result.summary.briefsGenerated],
              ["Suppressed", result.summary.filingsSuppressed],
            ].map(([label, value]) => (
              <div className="border border-[#d5dae3] bg-white p-4" key={label}>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748b]">
                  {label}
                </p>
                <p className="mt-3 font-mono text-3xl font-semibold">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="border border-[#d5dae3] bg-white p-3 text-sm text-[#334155]">
              Model: <span className="font-semibold">{result.telemetry?.model}</span>
            </div>
            <div className="border border-[#d5dae3] bg-white p-3 text-sm text-[#334155]">
              Brief threshold:{" "}
              <span className="font-semibold">
                {Math.round(
                  (result.telemetry?.briefConfidenceThreshold ?? 0.75) * 100,
                )}
                %
              </span>
            </div>
            <div className="border border-[#d5dae3] bg-white p-3 text-sm text-[#334155]">
              Classifications:{" "}
              <span className="font-semibold">
                {result.telemetry?.classificationsRun ?? 0}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
            <section className="border border-[#d5dae3] bg-white">
              <div className="border-b border-[#d5dae3] p-4">
                <h2 className="font-semibold">Generated briefs</h2>
                <p className="mt-1 text-sm text-[#64748b]">
                  Only actionable or high-urgency signals appear here.
                </p>
              </div>

              {result.briefs.length === 0 ? (
                <div className="p-6 text-sm leading-6 text-[#64748b]">
                  {postScanMessage(result)}
                </div>
              ) : (
                <div className="divide-y divide-[#e2e8f0]">
                  {result.briefs.map((brief) => (
                    <button
                      className="w-full p-4 text-left transition hover:bg-[#f8fafc]"
                      key={brief.id}
                      onClick={() => setSelectedBriefId(brief.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold">{brief.title}</h3>
                        <span className="border border-[#cbd5e1] px-2 py-1 text-xs">
                          {brief.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#64748b]">
                        {brief.targetCompany} / {brief.triggerType}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="min-h-[520px] border border-[#d5dae3] bg-white">
              {selectedBrief ? (
                <BriefDetail
                  brief={selectedBrief}
                  copyText={copyText}
                  submitFeedback={submitFeedback}
                  updateStatus={updateStatus}
                />
              ) : selectedEvent ? (
                <EventDetail event={selectedEvent} promoteCandidate={promoteCandidate} />
              ) : (
                <div className="flex min-h-[520px] items-center justify-center p-8 text-center text-[#64748b]">
                  Select a generated brief or scan log event to inspect the
                  evidence path.
                </div>
              )}
            </section>
          </div>

          <section className="mt-5 border border-[#d5dae3] bg-white">
            <div className="border-b border-[#d5dae3] p-4">
              <h2 className="font-semibold">Scan log</h2>
              <p className="mt-1 text-sm text-[#64748b]">
                Shows why filings were skipped, suppressed, rejected, or turned
                into briefs.
              </p>
              <p className="mt-2 text-sm font-medium text-[#334155]">
                {result.notification.message}
              </p>
            </div>
            {result.events.length === 0 ? (
              <div className="p-5 text-sm text-[#64748b]">
                No scan log yet.
              </div>
            ) : (
              <div className="divide-y divide-[#e2e8f0]">
                {result.events.map((event, index) => (
                  <button
                    className="grid w-full gap-3 p-4 text-left hover:bg-[#f8fafc] md:grid-cols-[120px_1fr_160px]"
                    key={`${event.type}-${index}`}
                    onClick={() => {
                      setSelectedEventIndex(index);
                      setSelectedBriefId(null);
                    }}
                    type="button"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#334155]">
                      {eventLabel(event)}
                    </span>
                    <span className="text-sm text-[#334155]">
                      {event.ticker ? `${event.ticker}: ` : ""}
                      {event.rationale}
                    </span>
                    <span className="text-sm text-[#64748b]">
                      {event.classification ??
                        event.signalModule ??
                        event.accessionNumber ??
                        ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function BriefDetail({
  brief,
  copyText,
  submitFeedback,
  updateStatus,
}: {
  brief: SalesActionBrief;
  copyText: (text: string) => Promise<void>;
  submitFeedback: (brief: SalesActionBrief, relevant: boolean) => Promise<void>;
  updateStatus: (status: BriefStatus) => Promise<void>;
}) {
  return (
    <div>
      <div className="border-b border-[#d5dae3] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#64748b]">
              {brief.sellerCompany} Sales Team
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{brief.title}</h2>
          </div>
          <select
            className="h-10 border border-[#cbd5e1] bg-white px-3 text-sm"
            value={brief.status}
            onChange={(event) => updateStatus(event.target.value as BriefStatus)}
          >
            {statusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <Info label="Target" value={brief.targetCompany} />
          <Info label="Priority" value={brief.urgency} />
          <Info label="Confidence" value={`${brief.confidenceScore}%`} />
        </div>

        <BriefSection title="Evidence">
          <span>&quot;{brief.evidenceSnippet}&quot;</span>
        </BriefSection>
        <BriefSection title="Why CrowdStrike should care">
          {brief.whyItMatters}
        </BriefSection>
        <BriefSection title="Buyer personas">
          {brief.buyerPersonas.join(", ")}
        </BriefSection>
        <BriefSection title="Sales motion">
          {brief.suggestedSalesMotion}
        </BriefSection>
        <BriefSection title="Outreach angle">
          {brief.suggestedOutreachAngle}
        </BriefSection>
        <BriefSection title="Sensitivity">
          {brief.outreachSensitivity}
        </BriefSection>
        <BriefSection title="Next step">
          {brief.recommendedNextStep}
        </BriefSection>
        <BriefSection title="Why flagged">{brief.whyFlagged}</BriefSection>

        <div className="flex flex-wrap gap-3">
          <button
            className="h-10 border border-[#cbd5e1] px-4 text-sm font-semibold"
            onClick={() => copyText(brief.suggestedOutreachAngle)}
            type="button"
          >
            Copy outreach angle
          </button>
          <button
            className="h-10 bg-[#111827] px-4 text-sm font-semibold text-white"
            onClick={() => copyText(briefToText(brief))}
            type="button"
          >
            Export brief text
          </button>
          <button
            className="h-10 border border-[#16a34a] px-4 text-sm font-semibold text-[#166534]"
            onClick={() => submitFeedback(brief, true)}
            type="button"
          >
            Mark relevant
          </button>
          <button
            className="h-10 border border-[#f97316] px-4 text-sm font-semibold text-[#9a3412]"
            onClick={() => submitFeedback(brief, false)}
            type="button"
          >
            Mark not relevant
          </button>
        </div>
      </div>
    </div>
  );
}

function EventDetail({
  event,
  promoteCandidate,
}: {
  event: ScanEvent;
  promoteCandidate: (event: ScanEvent) => Promise<void>;
}) {
  return (
    <div className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
        Scan event
      </p>
      <h2 className="mt-2 text-2xl font-semibold">{eventLabel(event)}</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Info label="Ticker" value={event.ticker ?? "N/A"} />
        <Info label="Module" value={event.signalModule ?? "N/A"} />
        <Info
          label="Confidence"
          value={
            typeof event.confidence === "number"
              ? `${Math.round(event.confidence * 100)}%`
              : "N/A"
          }
        />
      </div>
      <div className="mt-5 grid gap-5">
        <BriefSection title="Rationale">{event.rationale}</BriefSection>
        <BriefSection title="Classification">
          {event.classification ?? "N/A"}
        </BriefSection>
        <BriefSection title="Matched keywords">
          {event.keywordMatches?.join(", ") || "N/A"}
        </BriefSection>
        <BriefSection title="Filing">
          {event.accessionNumber ?? "N/A"}
          {event.filingUrl ? ` / ${event.filingUrl}` : ""}
        </BriefSection>
        {event.type === "candidate_rejected" && event.candidateId ? (
          <button
            className="h-10 w-fit bg-[#111827] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={event.candidateId.startsWith("fixture-")}
            onClick={() => promoteCandidate(event)}
            type="button"
          >
            Promote candidate to brief
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e2e8f0] p-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748b]">
        {label}
      </p>
      <p className="mt-2 break-words font-semibold">{value}</p>
    </div>
  );
}

function BriefSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
        {title}
      </h3>
      <p className="mt-2 break-words text-sm leading-6 text-[#334155]">
        {children}
      </p>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { crowdStrikeProfile } from "@/lib/signal-profile";
import type { BriefStatus, SalesActionBrief, ScanResult } from "@/lib/types";

const statusOptions: BriefStatus[] = [
  "New",
  "Reviewed",
  "Relevant",
  "Not Relevant",
  "Archived",
];

const emptyResult: ScanResult = {
  scanRunId: "not-run",
  summary: {
    filingsScanned: 0,
    candidatesFound: 0,
    briefsGenerated: 0,
    filingsSuppressed: 0,
  },
  briefs: [],
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

export function Dashboard() {
  const [tickers, setTickers] = useState("MSFT\nOKTA\nCRWD");
  const [result, setResult] = useState<ScanResult>(emptyResult);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);

  const selectedBrief =
    result.briefs.find((brief) => brief.id === selectedBriefId) ??
    result.briefs[0] ??
    null;

  const normalizedTickers = useMemo(
    () =>
      tickers
        .split(/[\s,]+/)
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean),
    [tickers],
  );

  function loadDemo() {
    setResult({
      scanRunId: "demo-run",
      summary: {
        filingsScanned: 8,
        candidatesFound: 2,
        briefsGenerated: 1,
        filingsSuppressed: 7,
      },
      briefs: [mockBrief],
      errors: [],
    });
    setSelectedBriefId(mockBrief.id);
    setIsDemoLoaded(true);
  }

  function updateStatus(status: BriefStatus) {
    if (!selectedBrief) return;
    setResult((current) => ({
      ...current,
      briefs: current.briefs.map((brief) =>
        brief.id === selectedBrief.id ? { ...brief, status } : brief,
      ),
    }));
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
              value="CrowdStrike"
              disabled
            >
              <option>CrowdStrike</option>
            </select>
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

          <button
            className="mt-6 h-11 w-full bg-[#111827] px-4 text-sm font-semibold text-white transition hover:bg-[#273244]"
            onClick={loadDemo}
            type="button"
          >
            {isDemoLoaded ? "Demo scan loaded" : "Run Scan"}
          </button>

          <section className="mt-8 border border-[#d5dae3] bg-white p-4">
            <h2 className="text-sm font-semibold">CrowdStrike profile</h2>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              {crowdStrikeProfile.productsSummary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {crowdStrikeProfile.modules.map((module) => (
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
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["Filings scanned", result.summary.filingsScanned],
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
                  No scan results yet. Run the demo scan to preview the review
                  workflow; later phases connect this to live SEC and OpenAI
                  processing.
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
                        {brief.targetCompany} · {brief.triggerType}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="min-h-[520px] border border-[#d5dae3] bg-white">
              {selectedBrief ? (
                <div>
                  <div className="border-b border-[#d5dae3] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#64748b]">
                          {selectedBrief.sellerCompany} Sales Team
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold">
                          {selectedBrief.title}
                        </h2>
                      </div>
                      <select
                        className="h-10 border border-[#cbd5e1] bg-white px-3 text-sm"
                        value={selectedBrief.status}
                        onChange={(event) =>
                          updateStatus(event.target.value as BriefStatus)
                        }
                      >
                        {statusOptions.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-5 p-5">
                    <div className="grid gap-3 md:grid-cols-3">
                      <Info label="Target" value={selectedBrief.targetCompany} />
                      <Info label="Priority" value={selectedBrief.urgency} />
                      <Info
                        label="Confidence"
                        value={`${selectedBrief.confidenceScore}%`}
                      />
                    </div>

                    <BriefSection title="Evidence">
                      “{selectedBrief.evidenceSnippet}”
                    </BriefSection>
                    <BriefSection title="Why CrowdStrike should care">
                      {selectedBrief.whyItMatters}
                    </BriefSection>
                    <BriefSection title="Buyer personas">
                      {selectedBrief.buyerPersonas.join(", ")}
                    </BriefSection>
                    <BriefSection title="Sales motion">
                      {selectedBrief.suggestedSalesMotion}
                    </BriefSection>
                    <BriefSection title="Outreach angle">
                      {selectedBrief.suggestedOutreachAngle}
                    </BriefSection>
                    <BriefSection title="Sensitivity">
                      {selectedBrief.outreachSensitivity}
                    </BriefSection>
                    <BriefSection title="Next step">
                      {selectedBrief.recommendedNextStep}
                    </BriefSection>
                    <BriefSection title="Why flagged">
                      {selectedBrief.whyFlagged}
                    </BriefSection>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="h-10 border border-[#cbd5e1] px-4 text-sm font-semibold"
                        onClick={() =>
                          copyText(selectedBrief.suggestedOutreachAngle)
                        }
                        type="button"
                      >
                        Copy outreach angle
                      </button>
                      <button
                        className="h-10 bg-[#111827] px-4 text-sm font-semibold text-white"
                        onClick={() => copyText(briefToText(selectedBrief))}
                        type="button"
                      >
                        Export brief text
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[520px] items-center justify-center p-8 text-center text-[#64748b]">
                  Select a generated brief to inspect evidence, buyer personas,
                  sales motion, sensitivity, and next step.
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e2e8f0] p-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748b]">
        {label}
      </p>
      <p className="mt-2 font-semibold">{value}</p>
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
      <p className="mt-2 text-sm leading-6 text-[#334155]">{children}</p>
    </section>
  );
}

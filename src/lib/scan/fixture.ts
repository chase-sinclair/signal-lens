import "server-only";

import { BRIEF_CONFIDENCE_THRESHOLD, activeModelName } from "@/lib/scan/config";
import { crowdStrikeProfile } from "@/lib/signal-profile";
import type { ScanResult } from "@/lib/types";

export function fixtureScanResult(): ScanResult {
  const brief = {
    id: "fixture-crowdstrike-brief",
    title: "Customer Data Access Incident Creates Security Readiness Motion",
    sellerCompany: "CrowdStrike",
    targetCompany: "Fixture Health Systems",
    ticker: "FXTR",
    filingType: "8-K / Exhibit 99.1",
    filingDate: "2026-05-13",
    filingUrl: "https://www.sec.gov/Archives/edgar/fixture",
    triggerType: "Cybersecurity incident disclosure",
    urgency: "High",
    confidenceScore: 93,
    evidenceSnippet:
      "The company identified unauthorized access to customer data and initiated incident response and remediation activities.",
    whyItMatters:
      "The disclosure maps directly to CrowdStrike's incident response, endpoint detection, identity protection, and board-level cyber risk reporting motions.",
    buyerPersonas: crowdStrikeProfile.buyerPersonas,
    suggestedSalesMotion:
      "Route to Enterprise Security AE and Security Solutions Engineer for account review.",
    suggestedOutreachAngle:
      "Lead with resilience, incident readiness, threat visibility, and governance reporting rather than breach language.",
    outreachSensitivity:
      "High. Avoid fear-based language and avoid directly saying the company was breached.",
    recommendedNextStep:
      "Review account ownership, confirm existing security contacts, and create a strategic account task.",
    whyFlagged:
      "Fixture matched Cybersecurity Incident with unauthorized access, customer data, incident response, and remediation evidence.",
    status: "New" as const,
  };

  return {
    scanRunId: "fixture-run",
    mode: "fixture",
    summary: {
      filingsScanned: 1,
      newFilingsProcessed: 1,
      filingsSkipped: 0,
      candidatesFound: 1,
      briefsGenerated: 1,
      filingsSuppressed: 0,
    },
    telemetry: {
      model: activeModelName(),
      briefConfidenceThreshold: BRIEF_CONFIDENCE_THRESHOLD,
      classificationsRun: 1,
    },
    briefs: [brief],
    events: [
      {
        type: "filing_processed",
        ticker: "FXTR",
        targetCompany: "Fixture Health Systems",
        accessionNumber: "0000000000-26-000001",
        filingDate: "2026-05-13",
        filingUrl: brief.filingUrl,
        rationale: "Fixture filing processed for deterministic demo.",
      },
      {
        type: "candidate_found",
        candidateId: "fixture-candidate",
        ticker: "FXTR",
        targetCompany: "Fixture Health Systems",
        accessionNumber: "0000000000-26-000001",
        filingDate: "2026-05-13",
        filingUrl: brief.filingUrl,
        sectionLabel: "Item 1.05 Material Cybersecurity Incidents",
        signalModule: "Cybersecurity Incident",
        keywordMatches: [
          "unauthorized access",
          "customer data",
          "incident response",
          "remediation",
        ],
        rationale:
          "Matched CrowdStrike keywords with concrete event language.",
      },
      {
        type: "brief_generated",
        candidateId: "fixture-candidate",
        ticker: "FXTR",
        targetCompany: "Fixture Health Systems",
        accessionNumber: "0000000000-26-000001",
        filingDate: "2026-05-13",
        filingUrl: brief.filingUrl,
        sectionLabel: "Item 1.05 Material Cybersecurity Incidents",
        signalModule: "Cybersecurity Incident",
        keywordMatches: [
          "unauthorized access",
          "customer data",
          "incident response",
          "remediation",
        ],
        classification: "High-Urgency Signal",
        confidence: 0.93,
        rationale:
          "Candidate met the action threshold and generated a Sales Action Brief.",
      },
    ],
    notification: {
      shouldNotify: true,
      channel: "brief_created",
      message: "1 SignalLens brief generated for CrowdStrike.",
    },
    errors: [],
  };
}
